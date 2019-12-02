const video = document.querySelector('video')

video.addEventListener("timeupdate",function(){
  var timeDisplay;
  //用秒数来显示当前播放进度
  timeDisplay = Math.floor(video.currentTime);
  console.log(Math.floor(video.currentTime))

  //当视频播放到 4s的时候做处理
  if(timeDisplay == 4){
          //处理代码
  }
},false);   

video.addEventListener('durationchange', function(e) {
  console.log('提示视频的时长已改变')
  console.log(e)
  console.log('video.duration---', video.duration)           // 528.981333   视频的实际时长（单位：秒）
})

setTimeout(() => {
  video.currentTime = 120
}, 5000)