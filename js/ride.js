// /*global WildRydes _config*/

// var WildRydes = window.WildRydes || {};
// WildRydes.map = WildRydes.map || {};

// (function rideScopeWrapper($) {
//     var authToken;
//     WildRydes.authToken.then(function setAuthToken(token) {
//         if (token) {
//             authToken = token;
//         } else {
//             window.location.href = '/signin.html';
//         }
//         console.log(authToken);
//     }).catch(function handleTokenError(error) {
//         alert(error);
//         window.location.href = '/signin.html';
//     });
//     function requestUnicorn(pickupLocation) {
//         $.ajax({
//             method: 'POST',
//             url: _config.api.invokeUrl + '/ride',
//             headers: {
//                 Authorization: authToken
//             },
//             data: JSON.stringify({
//                 PickupLocation: {
//                     Latitude: pickupLocation.latitude,
//                     Longitude: pickupLocation.longitude
//                 }
//             }),
//             contentType: 'application/json',
//             success: completeRequest,
//             error: function ajaxError(jqXHR, textStatus, errorThrown) {
//                 console.error('Error requesting ride: ', textStatus, ', Details: ', errorThrown);
//                 console.error('Response: ', jqXHR.responseText);
//                 console.log(authToken);
                
//                 alert('An error occured when requesting your unicorn:\n' + jqXHR.responseText);
//             }
//         });
//     }

//     function completeRequest(result) {
//         var unicorn;
//         var pronoun;
//         console.log('Response received from API: ', result);
//         unicorn = result.Unicorn;
//         pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
//         displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
//         animateArrival(function animateCallback() {
//             displayUpdate(unicorn.Name + ' has arrived. Giddy up!');
//             WildRydes.map.unsetLocation();
//             $('#request').prop('disabled', 'disabled');
//             $('#request').text('Set Pickup');
//         });
//     }

//     // Register click handler for #request button
//     $(function onDocReady() {
//         $('#request').click(handleRequestClick);
//         $(WildRydes.map).on('pickupChange', handlePickupChanged);

//         WildRydes.authToken.then(function updateAuthMessage(token) {
//             if (token) {
//                 displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
//                 $('.authToken').text(token);
//             }
//         });

//         if (!_config.api.invokeUrl) {
//             $('#noApiMessage').show();
//         }
//     });

//     function handlePickupChanged() {
//         var requestButton = $('#request');
//         requestButton.text('Request Unicorn');
//         requestButton.prop('disabled', false);
//     }

//     function handleRequestClick(event) {
//         var pickupLocation = WildRydes.map.selectedPoint;
//         event.preventDefault();
//         requestUnicorn(pickupLocation);
//     }

//     function animateArrival(callback) {
//         var dest = WildRydes.map.selectedPoint;
//         var origin = {};

//         if (dest.latitude > WildRydes.map.center.latitude) {
//             origin.latitude = WildRydes.map.extent.minLat;
//         } else {
//             origin.latitude = WildRydes.map.extent.maxLat;
//         }

//         if (dest.longitude > WildRydes.map.center.longitude) {
//             origin.longitude = WildRydes.map.extent.minLng;
//         } else {
//             origin.longitude = WildRydes.map.extent.maxLng;
//         }

//         WildRydes.map.animate(origin, dest, callback);
//     }

//     function displayUpdate(text) {
//         $('#updates').append($('<li>' + text + '</li>'));
//     }
// }(jQuery));

/*global WildRydes _config*/

var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};

(function rideScopeWrapper($) {
    var authToken;
    
    // Improved token handling with better error management
    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
            console.log('Auth token set successfully');
        } else {
            console.error('No auth token received, redirecting to signin');
            window.location.href = '/signin.html';
        }
    }).catch(function handleTokenError(error) {
        console.error('Token error:', error);
        alert('Authentication error: ' + error);
        window.location.href = '/signin.html';
    });

    function requestUnicorn(pickupLocation) {
        // Validate inputs
        if (!pickupLocation || !pickupLocation.latitude || !pickupLocation.longitude) {
            alert('Please select a valid pickup location');
            return;
        }

        if (!authToken) {
            alert('Authentication token not available. Please sign in again.');
            window.location.href = '/signin.html';
            return;
        }

        // Show loading state
        $('#request').prop('disabled', true);
        $('#request').text('Requesting...');
        displayUpdate('Requesting your unicorn...');

        $.ajax({
            method: 'POST',
            url: _config.api.invokeUrl + '/ride',
            headers: {
                'Authorization': authToken,
                'Content-Type': 'application/json',
                // Add CORS headers for preflight requests
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            data: JSON.stringify({
                PickupLocation: {
                    Latitude: parseFloat(pickupLocation.latitude),
                    Longitude: parseFloat(pickupLocation.longitude)
                }
            }),
            contentType: 'application/json',
            dataType: 'json',
            timeout: 30000, // 30 second timeout
            success: completeRequest,
            error: function ajaxError(jqXHR, textStatus, errorThrown) {
                console.error('Error requesting ride:', textStatus, 'Details:', errorThrown);
                console.error('Status Code:', jqXHR.status);
                console.error('Response Text:', jqXHR.responseText);
                console.error('Auth Token:', authToken ? 'Present' : 'Missing');
                
                // Reset button state
                $('#request').prop('disabled', false);
                $('#request').text('Request Unicorn');
                
                // Handle different types of errors
                let errorMessage = 'An error occurred when requesting your unicorn:\n';
                
                if (jqXHR.status === 0) {
                    errorMessage += 'Network error - please check your connection and try again.';
                } else if (jqXHR.status === 401) {
                    errorMessage += 'Authentication failed. Please sign in again.';
                    setTimeout(() => {
                        window.location.href = '/signin.html';
                    }, 2000);
                } else if (jqXHR.status === 403) {
                    errorMessage += 'Access forbidden. Please check your permissions.';
                } else if (jqXHR.status === 404) {
                    errorMessage += 'Service not found. Please contact support.';
                } else if (jqXHR.status >= 500) {
                    errorMessage += 'Server error. Please try again later.';
                } else if (textStatus === 'timeout') {
                    errorMessage += 'Request timed out. Please try again.';
                } else {
                    errorMessage += jqXHR.responseText || textStatus || 'Unknown error occurred.';
                }
                
                displayUpdate('Error: ' + errorMessage);
                alert(errorMessage);
            }
        });
    }

    function completeRequest(result) {
        console.log('Response received from API:', result);
        
        // Validate response
        if (!result || !result.Unicorn) {
            console.error('Invalid response format:', result);
            alert('Invalid response from server. Please try again.');
            $('#request').prop('disabled', false);
            $('#request').text('Request Unicorn');
            return;
        }
        
        var unicorn = result.Unicorn;
        var pronoun = unicorn.Gender === 'Male' ? 'his' : 'her';
        
        displayUpdate(unicorn.Name + ', your ' + unicorn.Color + ' unicorn, is on ' + pronoun + ' way.');
        
        animateArrival(function animateCallback() {
            displayUpdate(unicorn.Name + ' has arrived. Giddy up!');
            WildRydes.map.unsetLocation();
            $('#request').prop('disabled', true);
            $('#request').text('Set Pickup');
        });
    }

    // Register click handler for #request button
    $(function onDocReady() {
        $('#request').click(handleRequestClick);
        $(WildRydes.map).on('pickupChange', handlePickupChanged);

        WildRydes.authToken.then(function updateAuthMessage(token) {
            if (token) {
                displayUpdate('You are authenticated. Click to see your <a href="#authTokenModal" data-toggle="modal">auth token</a>.');
                $('.authToken').text(token);
            }
        }).catch(function(error) {
            console.error('Error updating auth message:', error);
        });

        if (!_config.api.invokeUrl) {
            $('#noApiMessage').show();
            console.error('API invoke URL not configured');
        }
    });

    function handlePickupChanged() {
        var requestButton = $('#request');
        requestButton.text('Request Unicorn');
        requestButton.prop('disabled', false);
    }

    function handleRequestClick(event) {
        event.preventDefault();
        
        var pickupLocation = WildRydes.map.selectedPoint;
        
        if (!pickupLocation) {
            alert('Please select a pickup location on the map first.');
            return;
        }
        
        requestUnicorn(pickupLocation);
    }

    function animateArrival(callback) {
        var dest = WildRydes.map.selectedPoint;
        var origin = {};

        if (dest.latitude > WildRydes.map.center.latitude) {
            origin.latitude = WildRydes.map.extent.minLat;
        } else {
            origin.latitude = WildRydes.map.extent.maxLat;
        }

        if (dest.longitude > WildRydes.map.center.longitude) {
            origin.longitude = WildRydes.map.extent.minLng;
        } else {
            origin.longitude = WildRydes.map.extent.maxLng;
        }

        WildRydes.map.animate(origin, dest, callback);
    }

    function displayUpdate(text) {
        $('#updates').append($('<li>' + text + '</li>'));
    }

}(jQuery));
