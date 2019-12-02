import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import PropTypes from 'prop-types'

const BottomBtn = ({text, colorClass, icon, onBtnClick}) => (
  <button
    type='button'
    className={`btn btn-block on-border ${colorClass}`}
    onClick={onBtnClick}
  >
    <FontAwesomeIcon 
      className='mr-2'
      size='lg'
      icon={icon} />
    {text}
  </button>
)

// 类型检查
BottomBtn.propTypes = {
  text: PropTypes.string,
  colorClass: PropTypes.string,
  icon: PropTypes.element.isRequired,
  onBtnClick: PropTypes.func
}
// 默认属性
BottomBtn.defaultProps = {
  text: '新建'
}

export default BottomBtn