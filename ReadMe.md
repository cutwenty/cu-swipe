# cu-swipe

为移动端写的轮播图插件。

思路：

1. 显示的轮播图放 left = 0 的位置，不显示的放 -width（轮播图容器宽度） 或 width 位置
2. 轮播图滑动使用 transition（从 [can i use](http://www.caniuse.com/) 查看兼容）
3. 提供一个 timeout 定时器，触发轮播图的滑动。轮播图滑动结束，触发 transitionEnd 事件后，再开一个定时器。（直接使用 interval 会有各种问题）

## 使用

	<div class='swipe-container'>
		<div class='swipe-wrapper'>
			<a class="swipe-slide">
				<img src="./images/batman.jpg" alt="">
			</a>
			<a class="swipe-slide">
				<img src="./images/dragon.jpg" alt="">
			</a>
			<a class="swipe-slide">
				<img src="./images/solid.jpg" alt="">
			</a>
			<a class="swipe-slide">
				<img src="./images/stream.jpg" alt="">
			</a>
		</div>
		<!-- <div class="swipe-pagination swipe-pagination-bullets">
			<span class="swipe-pagination-bullet"></span>
			<span class="swipe-pagination-bullet"></span>
			<span class="swipe-pagination-bullet"></span>
			<span class="swipe-pagination-bullet"></span>
		</div> -->
	</div>

initialSlide：初始轮播图的 index
	
autoPlay：轮播图滚动的时间间隔

speed：轮播图运动的时间

callback：轮播图开始滑动触发的回调

transitionEnd：轮播图滑动结束触发事件
	
	var swipe = new Swipe('.swipe-container', {
		autoPlay: 2000,
		speed: 300,
		initialSlide: 0,
		callback: function (index, slide) {
		  console.log('callback');
		},
		transitionEnd: function (index, slide, event) {
		  console.log('transition end');
		}
	});


## 样式

示例中的轮播图的样式使用的是 swiper 中的样式。

	.swipe-container {
		width: 100%;
		height: 250px;
		position: relative;
		overflow: hidden;
		z-index: 1;
	}
	.swipe-wrapper {
		position: relative;
		width: 100%;
		height: 100%;
		z-index: 1;
		-webkit-transform: translate3d(0,0,0);
		transform: translate3d(0,0,0);
		-webkit-transition-property: -webkit-transform;
		transition-property: -webkit-transform;
		transition-property: transform;
		transition-property: transform, -webkit-transform;
		box-sizing: content-box;
	}
	.swipe-slide {
		width: 100%;
		height: 100%;
		position: absolute;
		float: left;
	}
	.swipe-slide img {
		width: 100%;
		height: 100%;
	}
	.swipe-pagination-bullets {
	  bottom: 10px;
	  left: 0;
	  width: 100%;
	}
	.swipe-pagination {
	  position: absolute;
	  text-align: center;
	  -webkit-transition: .3s;
	  transition: .3s;
	  -webkit-transform: translate3d(0,0,0);
	  transform: translate3d(0,0,0);
	  z-index: 10;
	  line-height: 1;
	}
	.swipe-pagination-bullet {
	  width: 8px;
	  height: 8px;
	  margin: 0 5px;
	  display: inline-block;
	  border-radius: 100%;
	  background: #000;
	  opacity: .2;
	}
	.swipe-pagination-bullet-active {
	  opacity: 1;
	  background: #fff;
	}