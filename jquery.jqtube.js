(function($) {
    if (typeof $.timeout != "undefined") return;
    $.extend({
        interval : function (func,delay) {
            // init
            if (typeof $.interval.count == "undefined") $.interval.count = 0;
            if (typeof $.interval.funcs == "undefined") $.interval.funcs = new Array();
            // set interval
            if (typeof func =='string') return setInterval(func, delay);
            if (typeof func =='function') {
                $.interval.count++;
                $.interval.funcs[$.interval.count] = func;
                return setInterval("$.interval.funcs['"+$.interval.count+"']();", delay);
            }
        },
        clear : function (countdown) {
            clearInterval(countdown);
        }

    });
})(jQuery);
(function($){
    $.widget("ui.jqTube",{
        _init:function(){
            var that = this;
            this.ytplayer = null;
            this._elemId = this.element.attr("id");
            this.element.addClass("ui-widget ui-widget-content ui-corner-all").css({
                padding:"5px"
            });
            this.width = this.element.width();
            this.height = this.element.height();

            this.videoDiv = $("<div>").css({
                position:"relative",
                width:this.width+"px",
                height:(this.height-30)+"px"
            }).appendTo(this.element);
            this.ytDiv = $("<div>").attr("id",this._elemId+"-ytdiv").appendTo(this.videoDiv);
            this.volumeContainer = $("<div>").addClass("ui-widget ui-widget-content ui-corner-top").css({
                'position':"absolute",
                'right':"0px",
                'bottom':"0px",
                'height':"100px",
                'width':"50px",
                "display":"none"
            }).appendTo(this.videoDiv);

            this.volumeSlider = $("<div>").css({
                "margin-left":"auto",
                "margin-right":"auto",
                "width":"10px",
                "height":"80px",
                "margin-top":"10px"                
            }).slider({
                value:100,
                orientation:'vertical',
                change:function(event,ui){
                    if (that.ytplayer)that.ytplayer.setVolume(ui.value);
                }
            }).appendTo(this.volumeContainer);
            this.volumeSlider.children(".ui-slider-handle").css({
                'height':'10px',
                'width':'20px',
                'margin-bottom':'-6px',
                'left':'-6px'
            });

            this.footer = $("<div>").css({
                "margin-top":"5px"
            }).appendTo(this.element);
            this.playpause = $("<a>").css({
                "width":'50px',
                'height':'25px',
                'border':'none',
                'float':'left',
                'text-align':'center',
                'vertical-align':'middle'
            }).addClass("ui-state-default ui-corner-all").attr("title","play")
            .append($("<span class='ui-icon ui-icon-play'></span>").css("margin","3px auto")).appendTo(this.footer)
            .mousedown(function(){
                $(this).addClass("ui-state-active");
            })
            .mouseup(function(){
                $(this).removeClass("ui-state-active");
            })
            .hover(function(){
                $(this).addClass("ui-state-hover");
            },
            function(){
                $(this).removeClass("ui-state-hover");
            }
            ).click(function(){
                if (that.ytplayer){
                    if ($(this).attr("title")=="play"){
                        that.ytplayer.playVideo();
                    } else if ($(this).attr("title")=="pause"){
                        that.ytplayer.pauseVideo();
                    }

                }
            });
            this.progressBar = $("<div>").css({
                'height':'10px',
                'width':(this.width-124)+'px',
                'float':'left',
                'background':'none',
                'margin-left':'10px',
                'margin-right':'10px',
                'margin-top':'7px'
            }).appendTo(this.footer);
            this.positionSlider = $("<div>").css({
                'float':'left',
                'width':(this.width-125)+'px',
                'height':'10px',
                'background':'none',
                'border':'none'
            }).appendTo(this.progressBar);
            this.progressBar.progressbar({
                value:0
            });
            this.positionSlider.slider({
                start:function(event,ui){
                    if (that.ytplayer){
                        that.ytplayer.pauseVideo();
                        that.sliderDragging = true;
                    }
                },
                stop:function(event,ui){
                    if(that.ytplayer){
                        that.ytplayer.seekTo((ui.value/100)*that.ytplayer.getDuration(), true);
                        that.ytplayer.playVideo();
                        that.sliderDragging = false;
                    }
                }
            });
            this.positionSlider.children(".ui-slider-handle").css({
                'width':'10px',
                'height':'20px',
                'margin-left':'-6px',
                'top':'-6px'
            });
            this.volumeToggle = $("<div>").addClass("ui-state-default ui-corner-all")
            .append($("<span class='ui-icon ui-icon-volume-on'></span>").css('margin','3px auto')).appendTo(this.footer)
            .css({
                'width':'50px',
                'height':'25px',
                'border':'none',
                'float':'left',
                'text-align':'center',
                'vertical-align':'middle'
            })
            .hover(function(){
                $(this).addClass("ui-state-hover");
            },
            function(){
                $(this).removeClass("ui-state-hover");
            })
            .toggle(function(){
                that.volumeContainer.slideToggle(500);
                $(this).addClass("ui-state-active");
            }, function(){
                that.volumeContainer.slideToggle(500);
                $(this).removeClass("ui-state-active");
            });
            swfobject.embedSWF("http://www.youtube.com/apiplayer?enablejsapi=1&playerapiid="+this._elemId+"-ytapi",
                this._elemId+"-ytdiv", (this.width).toString(), (this.height-30).toString(), "8", null, null,
                {
                    allowScriptAccess: "always",
                    bgcolor: "#cccccc",
                    wmode:"opaque"
                }, {
                    id: this._elemId+"-ytplayer"
                });
           
        },
        playerReady:function(){
            //alert("PLAYER READY");
            var that = this;
            this.ytplayerobj = $("#"+this._elemId+"-ytplayer");
            this.ytplayer = this.ytplayerobj[0];
            this.ytplayer.cueVideoById(this.options.youTubeId);
            $.interval(function(){
                that._updatePlayerInfo();
            }, 250);
        },
        _updatePlayerInfo:function(){
            if(this.ytplayer){
                this._updateProgressBar(this.ytplayer.getVideoBytesLoaded()+this.ytplayer.getVideoStartBytes(), this.ytplayer.getVideoBytesTotal());
                this._updateSliderPosition(this.ytplayer.getCurrentTime(),this.ytplayer.getDuration());
                this._updatePlaypauseButton(this.ytplayer.getPlayerState());
            }
        },
        _updateProgressBar:function(bytes,totalBytes){
            var loaded = (totalBytes > 0)? ((bytes/totalBytes)*100): 0;
            this.progressBar.progressbar("option","value",loaded);
        },
        _updateSliderPosition:function(currentTime,duration){
            if (!this.sliderDragging){
                var position = (duration > 0)? ((currentTime/duration)*100) : 0;
                this.positionSlider.slider("option","value",position);
            }
        },
        _updatePlaypauseButton:function(state){
            switch(state){
                case 1:
                case 3:
                    this.playpause.attr("title","pause");
                    this.playpause.children().removeClass("ui-icon-play");
                    this.playpause.children().addClass("ui-icon-pause");
                    break;
                default:
                    this.playpause.attr("title","play");
                    this.playpause.children().removeClass("ui-icon-pause");
                    this.playpause.children().addClass("ui-icon-play");
                    break;
            }
        }
    });
    $.extend($.ui.jqTube,{
        version:"1.7.2"
    });
})(jQuery);
function onYouTubePlayerReady(playerId) {
    var widgetId = playerId.replace("-ytapi","");
    $("#"+widgetId).jqTube("playerReady");
}