
(function(global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? module.exports = factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.Swipe = factory());
})(this, function () {

  "user strict";

  var Swipe,
      // 获取浏览器的元素的style对象
      styleObj = document.createElement('div').style;

  // 浏览器属性
  var browser = {
    // 是否有 addEventListener 方法
    addEventListener: !!window.addEventListener,
    // 是否有touch事件
    touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
    // 浏览器的前缀
    prefix: (function (style) {
      var prefixes = ['t', 'webkitT', 'MozT', 'msT', 'OT'];
      // 根据指定前缀的属性是否在浏览器的style中，判断浏览器前缀
      return prefixes.reduce(function (prev, next) {
        if (!prev) {
          prev = (next+'ransform') in style? next: '';
        }
        return prev;
      }, '');
    })(styleObj),
    // 是否有transition属性
    transitions: (function(style) {
      var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
      return props.some(function (val) {
        return style[val] !== undefined? true: false;
      });
    })(styleObj)
  };

  /**
   * no operation
   */
  function noop () {}

  /**
   * 返回一个判断某种类型的函数
   * @param {string} type
   */
  function typeOf (type) {
    return function (val) {
      if (Object.prototype.toString.call(val) === '[object '+type+']') {
        return true;
      }
      return false;
    }
  }
  // 判断是否是字符串类型的函数
  var isString = typeOf('String');
  /**
   * 将多个对象合并中一起
   * @param {Object} to
   */
  function extend (to) {
    for (var i = 1; i < arguments.length; i++) {
      var from = arguments[i];
      for (var key in from) {
        if (from.hasOwnProperty(key)) {
          to[key] = from[key];
        }
      }
    }
    return to;
  }

  /**
   * Swipe的构造函数
   */
  Swipe = function (container, options) {
    if (!container) {
      return;
    }
    if (isString(container)) {
      container = document.querySelector(container);
    }

    var swipe = this,
        // slides的wrapper
        wrapper,
        // 轮播图
        slides,
        // container的宽度
        width,
        // 当前显示的轮播图的index，相对于 slides 元素（当只有两张轮播图时，会在0-3之间）
        currentIndex,
        // 轮播图的长度
        length,
        // 轮播图滑动的定时器
        timer,
        // 轮播图滑动的时间间隔
        // 在暴露的方法中，将autoPlay设为0，需要有autoPlay的备份
        autoPlay,
        // 默认配置选项
        defaultOptions = {
          wrapper: '',
          // 轮播图滑动速度
          speed: 300,
          // 初始的轮播图
          initialSlide: 0,
          // 轮播图滑动间隔
          autoPlay: 3000,
          // 轮播图能否手动滚动
          disableScroll: false,
          // 是否在手指操作轮播图时，阻止冒泡
          stopPropagation: false,
          // 图片开始运动的回调
          callback: noop,
          // 图片运动结束的回调
          transitionEnd: noop
        },
        // 事件处理器
        eventHandler = {
          // 事件触发时，会调用该方法
          handleEvent: function (event) {
            switch (event.type) {
              case 'touchstart': this.touchStart(event); break;
              case 'touchmove': this.touchMove(event); break;
              case 'touchend': this.touchEnd(event); break;
              case 'webkitTransitionEnd':
              case 'msTransitionEnd':
              case 'oTransitionEnd':
              case 'otransitionend':
              case 'transitionend': this.transitionEnd(event); break;
              case 'resize': _init(); break;
            }
            // 是否阻止冒泡
            if (options.stopPropagation) event.stopPropagation();
          },
          /**
           * 轮播图 transition 结束时触发
           */
          transitionEnd: function (event) {
            // transition结束触发的函数
            if (parseInt(event.target.getAttribute('data-index')) === currentIndex) {
              options.autoPlay && start();
              options.transitionEnd.call(swipe, currentIndex % length, slides[currentIndex], event);
            }
          },
          /**
           * touchstart 记录触摸轮播图时的手指坐标
           */
          touchStart: function (event) {
            var touch = event.touches[0];

            this.touch = {
              startX: touch.pageX,
              startY: touch.pageY,
              startTime: new Date().getTime(),
              moveX: 0,
              moveY: 0
            };

            // 添加事件监听器
            wrapper.addEventListener('touchmove', this, false);
            wrapper.addEventListener('touchend', this, false);
          },
          /**
           * touchmove事件监听
           */
          touchMove: function (event) {
            // 缩放手势、disableScroll时直接返回
            if (event.touches.length > 1 || event.scale && event.scale !== 1) {
              // 多指触碰、缩放，不监听
              return;
            }
            if (options.disableScroll) {
              return;
            }
            // 手指移动时，要清除定时器
            stop();

            // 记录手指移动距离
            var touch = event.touches[0];
            this.touch.moveX = touch.pageX - this.touch.startX;
            this.touch.moveY = touch.pageY - this.touch.startY;

            // 手指横向移动距离，大于纵向移动距离时才移动轮播图
            if (Math.abs(this.touch.moveX) > Math.abs(this.touch.moveY)) {
              event.preventDefault();
              // 移动相关的3张图片
              move(slides[circle(currentIndex-1)], -width+this.touch.moveX, 0);
              move(slides[currentIndex], this.touch.moveX, 0);
              move(slides[circle(currentIndex+1)], width+this.touch.moveX, 0);
            }
          },
          /**
           * touchmove事件触发器
           */
          touchEnd: function (event) {
            if (options.disableScroll) {
              return;
            }
            var speed = options.speed,
                timeDur = new Date().getTime() - this.touch.startTime,
                // 1 向左 -1 向右
                direction = this.touch.moveX < 0? 1: -1,
                // 是否触发轮播图滚动的方法
                // 手指移动了三分之一的轮播图宽度
                // 或者至少移动50px，并且移动时间小于300ms
                canScroll = Math.abs(this.touch.moveX) > width/3
                  || Math.abs(this.touch.moveX) > 50 && timeDur < 300;

            // 这里的轮播图滚动涉及4张
            // touchmove时的3张和将要显示的图片的下一张图片
            // 如果轮播图只有3张，不影响
            if (canScroll) {
              // 滚动到指定方向的位置
              move(slides[circle(currentIndex-direction)], -width*direction, 0);
              slideTo(currentIndex+direction, direction > 0? false: true);
            } else {
              // 回到原先位置
              move(slides[circle(currentIndex-1)], -width, speed);
              move(slides[currentIndex], 0, speed);
              move(slides[circle(currentIndex+1)], width, speed);
            }

            // 手指事件结束，移除事件监听
            wrapper.removeEventListener('touchmove', this, false);
            wrapper.removeEventListener('touchend', this, false);
          }
        };

    options = extend({}, defaultOptions, options);
    // 记录配置的 autoPlay 时间
    // 在 stop 函数中会清零
    autoPlay = options.autoPlay;

    // 初始化轮播图，并且开始滑动
    _init();

    /**
     * 初始化轮播图
     */
    function _init () {
      wrapper = options.wrapper
        ? document.querySelector(options.wrapper)
        : container.children[0];

      slides = wrapper.children;

      // 每个slide的宽度
      width = container.getBoundingClientRect().width || container.offsetWidth;

      // 当前显示的slide
      currentIndex = options.initialSlide;

      length = slides.length;

      // 只有两张时，需要添加两张
      if (length === 2) {
        wrapper.appendChild(slides[0].cloneNode(true));
        wrapper.appendChild(slides[1].cloneNode(true));
      }

      // 设置wrapper的宽度，slide的宽度
      wrapper.style.width = (2*width)+'px';
      // 初始化每个slide的位置和宽度
      Array.prototype.map.call(slides, function (slide, index) {
        var left = index-currentIndex > 0
          ? width
          : index === currentIndex? 0: -width;
        // 记录当前slide的顺序
        slide.setAttribute('data-index', index);

        slide.style.width = width + 'px';
        move(slide, left, 0);
      });

      // 添加事件监听
      wrapper.addEventListener(browser.prefix+'ransitionend', eventHandler, false);
      wrapper.addEventListener('resize', eventHandler, false);
      wrapper.addEventListener('touchstart', eventHandler, false);

      // 只有一张时，不滚动
      // 同时，不能手指滑动
      if (length <= 1) {
        options.disableScroll = true;
        return;
      }

      start();
    }

    /**
     * 轮播图开始运动
     */
    function start () {
      // autoplay为0时，不滑动
      if (!options.autoPlay) {
        return;
      }
      timer = setTimeout(slideNext, options.autoPlay);
    }

    /**
     * 停止下一张轮播图运动的 timer
     */
    function stop () {
      clearTimeout(timer);
    }

    /**
     * 滑动到下一张
     */
    function slideNext () {
      slideTo(currentIndex+1);
    }

    /**
     * 处理轮播图滑动的逻辑
     * @param {number} to        要显示的轮播图
     * @param {boolean} reverse   是否反方向，正向是向左为 false
     */
    function slideTo (to, reverse) {
      if (currentIndex === to) {
        return;
      }
      // 获取实际显示的轮播图的 index
      to = circle(to);
      var speed = options.speed,
          // 方向，向左 1， 向右 -1
          direction = reverse? -1: 1;

      // 隐藏当前显示的轮播图
      move(slides[currentIndex], -width*direction, speed);
      // 显示将要显示的轮播图
      move(slides[to], 0, speed);
      // 把后一个移到位置上
      move(slides[circle(to+direction)], width*direction, 0);

      // 记录当轮播图的 index
      currentIndex = to;

      // 调用 callback 回调
      options.callback && options.callback.call(swipe, currentIndex % length, slides[currentIndex]);
    }

    /**
     * 修改 css 的 transition，实现图片运动
     * @param {HTMLElemtn} slide  滑动的轮播图元素
     * @param {number} x          轮播图滑动到的位置
     * @param {number} speed      轮播图运动的速度
     */
    function move (slide, x, speed) {
      var style = slide.style;
      if (!style) {
        return;
      }
      style[browser.prefix+'ransitionDuration'] = speed + 'ms';
      style[browser.prefix+'ransform'] = 'translate('+x+'px,0)'+' translateZ(0)';
    }

    /**
     * 对传入的 index 对轮播图的张数取余，获取下一张轮播图实际的 index
     * @param {number} index
     */
    function circle (index) {
      return (index+slides.length) % slides.length;
    }

    /**
     * 将一些属性、方法暴露出去
     */
    swipe.container = container;
    swipe.wrapper = wrapper;
    swipe.slides = slides;
    swipe.length = length;
    swipe.options = options;

    /**
     * 这个stop和上面stop的区别在于，将autoplay设为了0
     * 没调用重新开始函数，轮播图不再滚动
     */
    swipe.stop = function () {
      swipe.options.autoPlay = 0;
      stop();
    };
    /**
     * 在调用stop后，调用该函数，重新开始滑动
     */
    swipe.restart = function () {
      // autoPlay为0时，才能调用start
      if (swipe.options.autoPlay) {
        return;
      }
      swipe.options.autoPlay = autoPlay;
      start();
    };
    /**
     * 获取当前显示的轮播图的index
     */
    swipe.getCurrentIndex = function () {
      return currentIndex % length;
    };
  };

  return Swipe;
});
