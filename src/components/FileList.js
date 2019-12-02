import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
import {getParentNode} from '../utils/helper'

const {remote} = window.require('electron')
const {Menu, MenuItem} = remote

const FileList = ({files, onFileClick, onSaveEdit, onFileDelete}) => {
  const [ editStatus, setEditStatus ] = useState(false)
  const [ value, setValue ] = useState('')
  const closeSearch = (editItem) => {
    // e.preventDefault()
    setEditStatus(false)
    setValue('')
    if(editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  const clickedItem = useContextMenu([
    {
      label: '打开',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if(parentElement) {
          onFileClick(parentElement.dataset.id)
        }
      }
    },
    {
      label: '重命名',
      click: () => {
        console.log('clicking1')
      }
    },
    {
      label: '删除',
      click: () => {
        console.log('clicking2')
      }
    }
  ], '.file-list', [files])

  // useEffect(() => {
  //   const menu = new Menu()
  //   menu.append(new MenuItem({
  //     label: '打开',
  //     click: () => {
  //       console.log('clicking')
  //     }
  //   }))
  //   menu.append(new MenuItem({
  //     label: '重命名',
  //     click: () => {
  //       console.log('clicking1')
  //     }
  //   }))
  //   menu.append(new MenuItem({
  //     label: '删除',
  //     click: () => {
  //       console.log('clicking2')
  //     }
  //   }))
  //   const handleContextMenu = (e) => {
  //     menu.popup({window: remote.getCurrentWindow()})
  //   }
  //   window.addEventListener('contextmenu', handleContextMenu)
  //   return () => {
  //     window.removeEventListener('contextmenu', handleContextMenu)
  //   }
  // })
  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if(enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew)
      setEditStatus(false)
      setValue('')
    }
    if(escPressed && editStatus) {
      closeSearch(editItem)
    }
    // const handleInputEvent = (event) => {
    //   const { keyCode } = event
    //   if(keyCode === 13 && editStatus) {
    //     const editItem = files.find(file => file.id === editStatus)
    //     onSaveEdit(editItem.id, value)
    //     setEditStatus(false)
    //     setValue('')
    //   } else if(keyCode === 27 && editStatus) {
    //     closeSearch(event)
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent)
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent)
    // }
  })
  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    if(newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.title)
    }
  }, [files])
  return (
    <ul className='list-group list-group-flush file-list'>
      {
        files.map(file => (
          <li
          className='list-group-item bg-light row d-flex align-items-center file-item mx-0'
          key={file.id}
          data-id={file.id}
          data-title={file.title}
          >
            { ((file.id !== editStatus) && !file.isNew) &&
            <>
              <span className='col-2'>
                <FontAwesomeIcon 
                  size='lg'
                  icon={faMarkdown} />
              </span>
              <span className="col-6 c-link"
                onClick={() => {onFileClick(file.id)}}
              >{file.title}</span>
              <button
                type='button'
                className="icon-button col-2"
                onClick={() => {setEditStatus(file.id); setValue(file.title)}}
              >
                <FontAwesomeIcon 
                  title='编辑'
                  size='xs'
                  icon={faEdit} />
              </button>
              {/* <button
                type='button'
                className="icon-button col-2"
                onClick={() => {onFileDelete(file.id)}}
              >
                <FontAwesomeIcon 
                  title='删除'
                  size='xs'
                  icon={faTrash} />
              </button> */}
            </>
            }
            {
              ((file.id === editStatus) || file.isNew ) &&
              <>
                <input
                  className="form-control col-10"
                  value={value}
                  placeholder='请输入文件名称'
                  onChange={(e) => {setValue(e.target.value)}}
                />
                <button
                  type='button'
                  className="icon-button col-2"
                  onClick={() => {closeSearch(file)}}
                >
                  <FontAwesomeIcon 
                    title='搜索'
                    size='lg'
                    icon={faTimes} />
                </button>
              </>
            }
          </li>
        ))
      }
    </ul>
  )
}

// 类型检查
FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}

export default FileList