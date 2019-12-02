import React, { useState, useEffect, useRef } from 'react'
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import Loader from './components/Loader'
import defaultFiles from './utils/defaultFiles'
import uuidv4 from 'uuid/v4'
import { flattenArr, objToArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'

import useIpcRenderer from './hooks/useIpcRenderer'

const {join, basename, extname, dirname} = window.require('path')
const {remote, ipcRenderer} = window.require('electron')
const Store = window.require('electron-store')

const fileStore = new Store({'name': 'Files Data'})
const settingsStore = new Store({name: 'Settings'})
// store.set('name', 'viking')
// console.log('--123---', store.get('name'))

const getAutoSync = () => {
  const qiniuIsConfiged =  ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
  return qiniuIsConfiged
}

const saveFilesToStore = (files) => {
  const filesStoreObj = objToArr(files).reduce((result, file) => {
    const {id, path, title, createdAt, isSynced, updatedAt} = file 
    result[id] = {
      id, path, title, createdAt, isSynced, updatedAt
    }
    return result
  }, {})
  fileStore.set('files', filesStoreObj)
}

function App() {
  // const [files, setFiles] = useState(flattenArr(defaultFiles))
  const [files, setFiles] = useState(fileStore.get('files') || {})
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unSaveFileIDs, setUnSaveFileIDs] = useState([])
  const [searchedFiles, setSearchedFiles] = useState([])
  const [isLoading, setLoading] = useState(false)
  const filesArr = objToArr(files)
  // store中获取
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
  // const openedFiles = openedFileIDs.map(openID => {
  //   return files.find(file => file.id === openID)
  // })
  const activeFile = files[activeFileID]
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const fileListArr = (searchedFiles.length > 0) ?searchedFiles: filesArr
  const fileClick = (fileID) => {
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const {id, title, path, isLoaded} = currentFile
    console.log('-----download-file-------', currentFile)
    if(!isLoaded) {
      if(getAutoSync() && currentFile.isSynced) {
        ipcRenderer.send('download-file', {key: `${title}.md`, path, id})
      } else {
        fileHelper.readFile(currentFile.path).then((value) => {
          const newFile = {...files[fileID], body:value, isLoaded: true}
          setFiles({...files, [fileID]: newFile})
        })
      }
    }

    if(!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }
  const tabClose = (id) => {
    const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    if(tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }
  const fileChange = (id, value) => {
    // const newFiles = files.map(file => {
    //   if(file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })
    if(value === files[id].body) {
      return
    }
    const newFile = {...files[id], body: value}
    setFiles({...files, [id]: newFile})
    if(!unSaveFileIDs.includes(id)) {
      setUnSaveFileIDs([...unSaveFileIDs, id])
    }
  }
  const deleteFile = (id) => {
    // const newFiles = files.filter(file =>  file.id !== id)
    if(files[id].isNew) {
      // delete files[id]
      const {[id]: value, ...afterDelete } = files
      // setFiles({...files})
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const {[id]: value, ...afterDelete } = files
        // setFiles({...files})
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        tabClose(id)
      })
    }
  }
  const updateFileName = (id, title, isNew) => {
    // const newFiles = files.map(file => {
    //   if(file.id === id) {
    //     file.title = title
    //     file.isNew = false
    //   }
    //   return file
    // })
    // setFiles(newFiles)
    const newPath = isNew?join(savedLocation, `${title}.md`)
      :join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = {...files[id], title, isNew: false, path: newPath} 
    const newFiles = {...files, [id]: modifiedFile}
    if(isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else { 
      // const oldPath = join(savedLocation, `${files[id].title}.md`)
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  const fileSearch = (keyword) => {
    const newFiles = filesArr.filter(file =>  file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }
  const createNewFile = () => {
    const newID = uuidv4()
    // const newFiles = [
    //   ...files,
    //   {
    //     id: newID,
    //     title: '',
    //     body: '## 请输入Markdown',
    //     createdAt: new Date().getTime(),
    //     isNew: true
    //   }
    // ]
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输入Markdown',
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({...files, [newID]: newFile})
    // setFiles(newFiles)
  }
  // const activeFile = files.find(file => file.id === activeFileID)
  const saveCurrentFile = () => {
    const {path, body, title} = activeFile
    // fileHelper.writeFile(join(savedLocation, `${activeFile.title}.md`), 
    fileHelper.writeFile(path, 
      body
    ).then(() => {
      setUnSaveFileIDs(unSaveFileIDs.filter(id => id !== activeFile.id))
      if(getAutoSync()) {
        ipcRenderer.send('upload-file', {key: `${title}.md`, path})
      }
    })
  }

  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的Markdown文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {name: 'Markdown files', extensions: ['md']}
      ]
    }).then(({filePaths}) => {
      console.log('-----paths-----', filePaths)
      if(Array.isArray(filePaths)) {
        const filteredPaths = filePaths.filter(path => {
          const alreadAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadAdded
        })
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          }
        })
        const newFiles = {
          ...files, ...flattenArr(importFilesArr)
        }
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if(importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`,
          })
        }
      }
    }).catch(err => {
      console.log(err)
    })
  }
  const activeFileUploaded = () => {
    const {id} = activeFile
    const modifiedFile = {...files[id], isSynced: true, updatedAt: new Date().getTime()}
    const newFiles = {...files, [id]: modifiedFile}
    setFiles(newFiles)
    saveFilesToStore(files)
  }

  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const {id, path} = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if(message.status === 'download-success') {
        newFile = {...files[id], body:value, isLoaded: true, isSynced: true, updateAt: new Date().getTime()} 
      } else {
        newFile = {...files[id], body:value, isLoaded: true } 
      }
      const newFiles = {...files, [id]: newFile}
      setFiles(newFiles)
      saveFilesToStore(files)
    })
  }
  const fileUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updateAt: currentTime
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'loading-status': (message, status) => {setLoading(status)},
    'file-uploaded': fileUploaded
  })
  return (
    <div className="App container-fluid px-0">
      {
        isLoading && 
        <Loader></Loader>
      }
      <div className='row no-gutters'>
        <div className='col-3 left-panel'>
          <FileSearch
            title='我的云文档'
            onFileSearch={(value) => {fileSearch(value)}}
          />
          <FileList
            files={fileListArr}
            onFileClick={(id) => {fileClick(id)}}
            onFileDelete={(id) => {deleteFile(id)}}
            onSaveEdit={(id, newValue, isNew) => {updateFileName(id, newValue, isNew)}}
          />
          <div className='row no-gutters button-group'>
            <div className='col'>
              <BottomBtn
                text='新建'
                colorClass='btn-primary'
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className='col'>
              <BottomBtn
                text='导入'
                colorClass='btn-success'
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className='col-9 right-panel'>
          {
            !activeFile &&
            <div className='start-page'>
              选择或者创建新的markdown文档
            </div>
          }
          {
            activeFile &&
            <>
              <TabList 
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unSaveFileIDs}
                onTabClick={(id) => {tabClick(id)}}
                onCloseTab={(id) => {tabClose(id)}}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={(value) => {fileChange(activeFile.id, value)}}
                options={
                  {
                    minHeight: '515px'
                  }
                }
              />
              {
                activeFile.isSynced && 
                <span className='sync-status'>已同步，上次同步{timestampToString(activeFile.updatedAt)}</span>
              }
              {/* <BottomBtn
                text='保存'
                colorClass='btn-warning'
                icon={faSave}
                onBtnClick={saveCurrentFile}
              /> */}
            </>
          }
          
        </div>
      </div>
    </div>
  );
}

export default App;
