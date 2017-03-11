/**
 * @ngdoc service
 * @service
 * @name preloader
 * @description The image preloader service
 * @requires $q
 * @requires $rootScope
 * @property {Object} imageLocations - array of images's sources
 * @property {Integer} loadCount - load count
 * @property {Integer} errorCount - error count
 * @property {Boolean} states - possible states that preloader can be in
 */
angular.module('preloader', []).factory('preloader', ['$q', '$rootScope', function ($q, $rootScope) {
    function Preloader(imageLocations) {
        this.imageLocations = imageLocations;
        this.imageCount = this.imageLocations.length;
        this.loadCount = 0;
        this.errorCount = 0;
        this.states = {
            PENDING: 1,
            LOADING: 2,
            RESOLVED: 3,
            REJECTED: 4
        };
        this.state = this.states.PENDING;
        this.deferred = $q.defer();
        this.promise = this.deferred.promise;
    }

    /**
     * @name preloader#preloadImages
     * @example
     * preloader.preloadImages([imageUrl]).then(function handleResolve() {}, function handleReject() {});
     * @description
     * reloads given images and returns a promise
     * @returns {Promise} Resolves with the array of image locations.
     */
    Preloader.preloadImages = function (imageLocations) {
        var preloader = new Preloader(imageLocations);
        return (preloader.load());
    };
    Preloader.prototype = {
        constructor: Preloader,
        isInitiated: function isInitiated() {
            return (this.state !== this.states.PENDING);
        },
        isRejected: function isRejected() {
            return (this.state === this.states.REJECTED);
        },
        isResolved: function isResolved() {
            return (this.state === this.states.RESOLVED);
        },

        /**
         * @name preloader#load
         * @example
         * return (preloader.load());
         * @description
         * if the images are already loading, return the existing promise.
         * @returns {Promise} Resolves with the array of image locations.
         */
        load: function load() {
            if (this.isInitiated()) {
                return (this.promise);
            }
            this.state = this.states.LOADING;
            for (var i = 0; i < this.imageCount; i++) {
                this.loadImageLocation(this.imageLocations[i]);
            }
            return (this.promise);
        },
        /**
         * @name preloader#handleImageError
         * @example
         * preloader.handleImageError(event.target.src);
         * @description
         * handles load-failure of given image location
         */
        handleImageError: function handleImageError(imageLocation) {
            this.errorCount++;
            if (this.isRejected()) {
                return;
            }
            this.state = this.states.REJECTED;
            this.deferred.reject(imageLocation);
        },
        /**
         * @name preloader#handleImageLoad
         * @example
         * preloader.handleImageLoad(event.target.src);
         * @description
         * notifies the progress of the overall deferred
         */
        handleImageLoad: function handleImageLoad(imageLocation) {
            this.loadCount++;
            if (this.isRejected()) {
                return;
            }
            this.deferred.notify({
                percent: Math.ceil(this.loadCount / this.imageCount * 100),
                imageLocation: imageLocation
            });
            if (this.loadCount === this.imageCount) {
                this.state = this.states.RESOLVED;
                this.deferred.resolve(this.imageLocations);
            }
        },
        /**
         * @name preloader#loadImageLocation
         * @example
         * this.loadImageLocation(this.imageLocations[i]);
         * @description
         * binds the event handlers before setting the image source
         */
        loadImageLocation: function loadImageLocation(imageLocation) {
            var preloader = this;
            var image = $(new Image())
                .load(
                    function (event) {
                        $rootScope.$apply(
                            function () {
                                preloader.handleImageLoad(event.target.src);
                                preloader = image = event = null;
                            }
                        );
                    }
                )
                .error(
                    function (event) {
                        $rootScope.$apply(
                            function () {
                                preloader.handleImageError(event.target.src);
                                preloader = image = event = null;
                            }
                        );
                    }
                )
                .prop('src', imageLocation);
        }
    };
    return (Preloader);
}]);
