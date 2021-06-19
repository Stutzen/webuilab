$(document).ready(function () {
    setTimeout(function () {
        var showData = $('#show-data');

        var $grid = $('.grid').masonry({
            gutter: 0,
            itemSelector: '.grid-item',
            horizontalOrder: false
        });

        $('.append-button').on('click', function () {
            getData();
        });
        var next_load = 0;
        const loadImg = function (data) {

            if (data.items.length) {
                var elts = [];
                item = next_load
                console.log(item);
                wrapper_div = document.createElement('a');
                wrapper_div.className = 'grid-item hidden';
                wrapper_div.href = data.items[item].src;
                wrapper_div.setAttribute("data-fancybox", "images");
                wrapper_div.setAttribute("data-type", "image");
                img = document.createElement('img');
                img.src = data.items[item].src;
                divnew = document.createElement('div');
                divnew.className = 'caption';
                div = document.createElement('p');
                div.append(data.items[item].html);
                divnew.append(div)
                wrapper_div.append(img)
                wrapper_div.append(divnew)
                elts.push(wrapper_div);
                next_load = item + 1;
                if (next_load >= data.items.length) {
                    //getData();
                    next_load = 0;
                    return;
                }
                var $elems = $(elts);
                $grid.append($elems).masonry('appended', $elems);
                $grid.imagesLoaded().progress(function (imgLoad, image) {
                    var $item = $(image.img).parent();

                    if ($item.hasClass('hidden')) {
                        $item.removeClass('hidden');
                        $grid.masonry();
                        loadImg(data);
                        $('[data-fancybox="images"]').fancybox({
                            idleTime: false,
                            baseClass: 'fancybox-custom-layout',
                            margin: 0,
                            gutter: 0,
                            infobar: false,
                            thumbs: {
                                hideOnClose: false,
                                parentEl: '.fancybox-outer'
                            },
                            touch: {
                                vertical: false
                            },
                            buttons: [
                                'close',
                                'thumbs',
                                'share',
                                'slideShow',
                                'zoom',
                                'fullScreen'
                            ],
                            animationEffect: "fade",
                            animationDuration: 300,
                            onInit: function (instance) {
                                instance.$refs.inner.wrap('<div class="fancybox-outer"></div>');
                            },
                            caption: function (instance, item) {
                                return $(this).find('.caption').html();
                            }
                        });
                    }

                });
            }
        }
        const getData = function () {

            $.getJSON('https://weblab.stutzen.xyz/json/layout2.json', function (data) {
                console.log(data);
                loadImg(data);
            });
        }
        getData();
    }, 2000);
});



