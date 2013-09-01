/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');
            elm.className = 'photo';
            elm.appendChild(img);
            elm.appendChild(createPhotoBottomBar(img));

            holder.appendChild(elm);
        };
    }

    /**
     * Creates the bottom bar for the provided image.
     * The bar includes the favourite toggle. It also add event listeners for this toggle.
     * @params img Image for which the bar is created.
     */
    function createPhotoBottomBar(img) {
        // Create the "bar" div element
        var bar = document.createElement('div');
        bar.className = 'bar';

        // Create the favourite icon and add it to the bar
        // It will be a filled or an empty heart, depending on whether it has been marked as favourite or not.
        var icon = document.createElement('i');
        icon.className = 'favourite icon-2x ' + getFavouriteClass(img.src);
        bar.appendChild(icon);

        // Add toggle click event listener
        $(icon).on('click', function() {
            toggleFavourite(img.src);
            
            // Update the icon
            $(this).removeClass('icon-heart icon-heart-empty').addClass(getFavouriteClass(img.src));
        });

        return bar;
    }

    /**
     * Returns the appropriate heart icon class.
     *   - Filled heart icon if the photo is stored as a favourite.
     *   - Empty heart otherwise 
     */
    function getFavouriteClass(url) {
        return (localStorage[url])? 'icon-heart': 'icon-heart-empty';    
    }

    /**
     * Toggles a photo from favourite to non favourite and viceversa.
     * It stores the status in localStorage in order to make it persistent 
     * (it will still be there when the page is closed and reopened)
     */
    function toggleFavourite(url) {
        if(localStorage[url]) {
            localStorage.removeItem(url);
        } else {
            localStorage.setItem(url, true);
        }    
    }

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
