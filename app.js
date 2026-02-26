var frontCamera = false;
var currentStream;

// Define constants
// Get the element in the document with id="camera-view", "camera-device", "photo-display", "take-photo-button" and "front-camera-button"
const
    cameraView = document.querySelector("#camera-view"),
    cameraDevice = document.querySelector("#camera-device"),
    photoDisplay = document.querySelector("#photo-display"),
    takePhotoButton = document.querySelector("#take-photo-button"),
    frontCameraButton = document.querySelector("#front-camera-button"),
    downloadPhotoButton = document.querySelector("#download-photo-button");

// Access the device camera and stream to cameraDevice
function cameraStart() {
    // Stop the video streaming before access the media device
    if (typeof currentStream !== 'undefined') {
        currentStream.getTracks().forEach(track => {
            track.stop();
        });
    }

// Set constraints for the video stream
// If frontCamera is true, use front camera
// Otherwise, user back camera
// "user" => Front camera
// "environment" => Back camera
    var constraints = { video: { facingMode: (frontCamera? "user" : "environment") }, audio: false };
    
    // Access the media device, camera in this example
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            currentStream = stream;
            cameraDevice.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Error happened.", error);
        });
}

// If takePhotoButton clicked => Take and display a photo
takePhotoButton.onclick = function() {
    cameraView.width = cameraDevice.videoWidth;
    cameraView.height = cameraDevice.videoHeight;
    cameraView.getContext("2d").drawImage(cameraDevice, 0, 0);
    photoDisplay.src = cameraView.toDataURL("image/webp");
    photoDisplay.classList.add("photo-taken");
    
    // Show the download button after taking a photo
    downloadPhotoButton.style.display = "flex";
};

// If Front/Back camera is click => Change to front/back camera accordingly
frontCameraButton.onclick = function() {
    // Toggle the frontCamera variable
    frontCamera = !frontCamera;
    // Setup the button text
    const buttonText = frontCameraButton.querySelector('span');
    if (frontCamera) {
        buttonText.textContent = "Back Camera!";
    }
    else {
        buttonText.textContent = "Front Camera!";
    }
    // Start the video streaming
    cameraStart();
};

// Download photo to device
downloadPhotoButton.onclick = function() {
    // Get the current timestamp for unique filename
    const timestamp = new Date().getTime();
    const filename = `camera-photo-${timestamp}.webp`;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = photoDisplay.src;
    link.download = filename;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Optional: Show a brief confirmation (you can enhance this with a toast notification)
    const originalText = downloadPhotoButton.querySelector('span').textContent;
    downloadPhotoButton.querySelector('span').textContent = 'Saved!';
    setTimeout(function() {
        downloadPhotoButton.querySelector('span').textContent = originalText;
    }, 2000);
};

// Start the camera and video streaming when the window loads
// 1st parameter: Event type
// 2nd parameter: Function to be called when the event occurs
window.addEventListener("load", cameraStart);

