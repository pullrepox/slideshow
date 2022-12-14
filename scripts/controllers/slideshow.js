'use strict';
/**
 * @ngdoc function
 * @name realApp.controller:SlideshowCtrl
 * @description
 * # SlideshowCtrl
 * Controller of the realApp
 */
angular.module('realApp')
		.controller('SlideshowCtrl', function ($scope, $window, $http, $timeout, $document, $localStorage, $sessionStorage) {
			var buf = $window.location.href;
			// get user id
			$scope.bufAry = buf.split("?");
			if ($scope.bufAry[1]) {
				$scope.bufAry1 = $scope.bufAry[1].split("=");
				$scope.external_userId = $scope.bufAry1[1];
				$window.localStorage.removeItem('downtime');
				$window.localStorage.removeItem('local_data');
//				if ($scope.external_userId) {
////                    alert($scope.external_userId);
//				}
			}
			// get all slides
			$scope.file_data = [];
			if ($scope.external_userId)
				$scope.reqest_data = $scope.external_userId;
			else
				$scope.reqest_data = $window.sessionStorage.user_id;
			var data = {
				user_id: $scope.reqest_data
			};
			var request = $http({// new file download begin
				method: "post",
				headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'},
				url: HOST_DIRECTORY + "get_slidefiles",
				data: $.param(data)
			});
			request.success(
				function (html) {
					if (html.result === "YES" && html.data.length !== 0) {
						var fdata = [];
						var now = new Date();
						if (NEW_REQUEST) {// when new request
							$scope.file_data = html.data;
							fdata = html.data;
							$window.localStorage.local_data = JSON.stringify(html.data);
							$window.localStorage.downtime = now; // now time update
							console.log("SERVER DATA :" + $window.localStorage.local_data + "/" + now);
						} else {
							if ($window.localStorage.local_data) { // if data
								$scope.file_data = JSON.parse($window.localStorage.local_data); // origin data
								fdata = JSON.parse($window.localStorage.local_data);
								;
								console.log("LOCAL Data:" + $scope.file_data + "/" + now);
							}
							else { // if no data
								$scope.file_data = html.data; // server data
								fdata = html.data;
								$window.localStorage.local_data = JSON.stringify(html.data);
								$window.localStorage.downtime = now; // now time update
								console.log("SERVER DATA :" + $window.localStorage.local_data + "/" + now);
							}
						}

						var w;
						var requestedBytes = 1024 * 1024 * 1024 * 4;
						var cnt = 0;
						$scope.startWorker = function () {
							if (typeof (Worker) !== "undefined") {
								if (typeof (w) == "undefined") {
									w = new Worker(location.origin + "/webworker/worker.js");
								}
								$window.requestFileSystem = $window.webkitRequestFileSystem;
								var onFSInit = function (fs) {
									for (var i = 0; i < fdata.length; i++) {
										w.postMessage([fdata[i].url, fdata[i].file_name]);
									}
									w.onmessage = function (event) {
										cnt = event.data[2];
										$scope.saveFile(fs, event.data[0], event.data[1]);
									};
									for (var j = 0; j < html.data1.length; j++) {
										$scope.removeFile(fs, ('/' + html.data1[j].file_name));
									}
								};
								navigator.webkitPersistentStorage.requestQuota(requestedBytes, function (grantedBytes) {
									$window.requestFileSystem(PERSISTENT, grantedBytes, onFSInit, $scope.errorHandler);
								}, $scope.errorHandler
										);
							} else {
								console.log("Sorry, your browser does not support Web Workers...");
							}
						};
						$scope.errorHandler = function (e) {
							console.log(e.name);
						};
						$scope.saveFile = function (fs, data, path) {
//								$scope.removeFile(fs, ('/' + path));
							fs.root.getFile(path, {create: true, exclusive: true}, function (fileEntry) {
								fileEntry.createWriter(function (writer) {
									writer.onwriteend = function (e) {
										console.log('complete');
									};
									writer.write(data);
								}, $scope.errorHandler);
							}, $scope.errorHandler);
//								console.log(cnt);
						};
						$scope.removeFile = function (fs, path) {
							fs.root.getFile(path, {create: false}, function (fileEntry) {
								fileEntry.remove(function () {
								}, $scope.errorHandler);
							}, $scope.errorHandler);
						};
						$scope.stopWorker = function () {
							w.terminate();
							w = undefined;
						};
						$scope.startWorker();
						// slide show begin
						var len = $scope.file_data.length;
						var slide = 0;
						var urlval = '';
						$scope.displaySlide = function () {
//								urlval = 'filesystem:' + location.origin + '/persistent/' + $scope.file_data[slide].file_name;
//								$window.webkitResolveLocalFileSystemURL(urlval, function(fileEntry) {
//									console.log(fileEntry);
//								});
							angular.element('#file_repo').find('video').get(0).stop();
							
							if ($scope.file_data[slide].file_type === "image") {
								$scope.view_control = false;
								if (urlval != '') {
									$scope.file_data[slide].url = urlval;
									$scope.image_url = urlval;
								} else {
									$scope.image_url = $scope.file_data[slide].url;
								}
								// effect setting
								switch ($scope.file_data[slide].start_effect) {
									case "fadein" :
										$scope.effect_style = "animate-fadein-enter";
										break;
									case "top":
										$scope.effect_style = "animate-top-enter";
										break;
									case "down":
										$scope.effect_style = "animate-down-enter";
										break;
									case "left":
										$scope.effect_style = "animate-left-enter";
										break;
									case "right":
										$scope.effect_style = "animate-right-enter";
										break;
									default:
										$scope.effect_style = "animate-fadein-enter";
										break;
								}
								// end effect setting
								switch ($scope.file_data[slide].end_effect) {
									case "fadeout" :
										$scope.effect_style += " " + "animate-fadeout-leave";
										break;
									case "top":
										$scope.effect_style += " " + "animate-top-leave";
										break;
									case "down":
										$scope.effect_style += " " + "animate-down-leave";
										break;
									case "left":
										$scope.effect_style += " " + "animate-left-leave";
										break;
									case "right":
										$scope.effect_style += " " + "animate-right-leave";
										break;
									default:
										$scope.effect_style += " " + "animate-fadeout-leave";
										break;
								}
							}
							else {
								$scope.view_control = true;
								if (urlval != '') {
									$scope.video_url = urlval;
								} else {
									$scope.video_url = $scope.file_data[slide].url;
								}
							}
							$scope.timer = $timeout($scope.displaySlide, $scope.file_data[slide].stay_time * 1000);
							// slide transition
							slide++;
							if (slide > len - 1) {
								slide = 0;
							}
//								console.log(cnt);
//								console.log(fdata.length);
							if (cnt == fdata.length) {
								urlval = 'filesystem:' + location.origin + '/persistent/' + $scope.file_data[slide].file_name;
							} else {
								urlval = '';
							}
						};
						$scope.displaySlide();
					}
					else { // No data
						var sheight = screen.availHeight * 1 - 100;
						var noimgstr = '<div class="nothingimg" style="height:' + sheight + 'px;">';
						noimgstr += '<img class="img-thumbnail img-responsive" alt="" src="' + location.origin + '/images/onpartv.png"/>';
						noimgstr += '</div>';
						$('.navbar').remove();
						$('#file_repo').html('').html(noimgstr);
					}
				}
			);
		});
