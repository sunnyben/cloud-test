import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'

const FileSearch = ({ title, onFileSearch }) => {
  const [ inputActive, setInputActive ] = useState(false)
  const [ value, setValue ] = useState('')
  // console.log('123213') //每次渲染都会执行?

  // let number = useRef(1)
  // number.current++
  // console.log('number.current--', number.current)

  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)

  let node = useRef(null)

  const closeSearch = (e) => {
    // e.preventDefault()
    setInputActive(false)
    setValue('')
    onFileSearch('')
  }
  useEffect(() => {
    if(enterPressed && inputActive) {
      onFileSearch(value)
    }
    if(escPressed && inputActive) {
      closeSearch()
    }
    // const handleInputEvent = (event) => {
    //   const { keyCode } = event
    //   if(keyCode === 13 && inputActive) {
    //     onFileSearch(value)
    //   } else if(keyCode === 27 && inputActive) {
    //     closeSearch(event)
    //   }
    // }
    // document.addEventListener('keyup', handleInputEvent)
    // return () => {
    //   document.removeEventListener('keyup', handleInputEvent)
    // }
  })
  useEffect(() => {
    if(inputActive) {
      node.current.focus()
    }
  }, [inputActive])
  return (
    <div className="alert alert-primary d-flex justify-content-between align-items-center mb-0">
      { !inputActive &&
        <>
          <span>{title}</span>
          <button
            type='button'
            className="icon-button"
            onClick={() => { setInputActive(true) }}
          >
            <FontAwesomeIcon 
              title='搜索'
              size='lg'
              icon={faSearch} />
          </button>
        </>
      }
      {
        inputActive &&
        <>
          <input
            className="form-control"
            value={value}
            ref={node}
            onChange={(e) => {setValue(e.target.value)}}
          />
          <button
            type='button'
            className="icon-button"
            onClick={closeSearch}
          >
            <FontAwesomeIcon 
              title='搜索'
              size='lg'
              icon={faTimes} />
          </button>
        </>
      }
    </div>
  )
}

// 类型检查
FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired
}
// 默认属性
FileSearch.defaultProps = {
  title: '我的云文档'
}

export default FileSearch