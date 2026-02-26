var frontCamera = false;
var currentStream;
var currentZoom = 1;
var currentFilter = 'none';
var flashEnabled = false;
var photoGallery = [];

// Define constants
const
    cameraView = document.querySelector("#camera-view"),
    cameraDevice = document.querySelector("#camera-device"),
    photoDisplay = document.querySelector("#photo-display"),
    takePhotoButton = document.querySelector("#take-photo-button"),
    frontCameraButton = document.querySelector("#front-camera-button"),
    downloadPhotoButton = document.querySelector("#download-photo-button"),
    deletePhotoButton = document.querySelector("#delete-photo-button"),
    flashButton = document.querySelector("#flash-button"),
    galleryButton = document.querySelector("#gallery-button"),
    photoCountBadge = document.querySelector("#photo-count-badge"),
    zoomSlider = document.querySelector("#zoom-slider"),
    zoomInButton = document.querySelector("#zoom-in-button"),
    zoomOutButton = document.querySelector("#zoom-out-button"),
    filterButtons = document.querySelectorAll(".filter-btn"),
    galleryModal = document.querySelector("#gallery-modal"),
    closeGalleryButton = document.querySelector("#close-gallery-button"),
    galleryContent = document.querySelector("#gallery-content"),
    photoPreviewControls = document.querySelector("#photo-preview-controls");

// Load gallery from localStorage
function loadGallery() {
    const saved = localStorage.getItem('cameraGallery');
    if (saved) {
        photoGallery = JSON.parse(saved);
        updateGalleryBadge();
    }
}

// Save gallery to localStorage
function saveGallery() {
    localStorage.setItem('cameraGallery', JSON.stringify(photoGallery));
    updateGalleryBadge();
}

// Update gallery badge count
function updateGalleryBadge() {
    if (photoGallery.length > 0) {
        photoCountBadge.textContent = photoGallery.length;
        photoCountBadge.style.display = 'block';
    } else {
        photoCountBadge.style.display = 'none';
    }
}

// Access the device camera and stream to cameraDevice
function cameraStart() {
    // Stop the video streaming before access the media device
    if (typeof currentStream !== 'undefined') {
        currentStream.getTracks().forEach(track => {
            track.stop();
        });
    }

    // Set constraints for the video stream
    var constraints = { 
        video: { 
            facingMode: (frontCamera ? "user" : "environment"),
            zoom: true
        }, 
        audio: false 
    };
    
    // Access the media device, camera in this example
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            currentStream = stream;
            cameraDevice.srcObject = stream;
            
            // Setup zoom capability
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.zoom) {
                zoomSlider.min = capabilities.zoom.min;
                zoomSlider.max = capabilities.zoom.max;
                zoomSlider.step = capabilities.zoom.step;
            }
        })
        .catch(function(error) {
            console.error("Error happened.", error);
        });
}

// Apply zoom to camera
function applyZoom(zoomValue) {
    if (currentStream) {
        const track = currentStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.zoom) {
            track.applyConstraints({
                advanced: [{ zoom: zoomValue }]
            }).catch(err => console.log("Zoom not supported", err));
        }
    }
    currentZoom = zoomValue;
}

// Apply filter to camera
function applyFilter(filter) {
    currentFilter = filter;
    let filterStyle = '';
    
    switch(filter) {
        case 'grayscale':
            filterStyle = 'grayscale(100%)';
            break;
        case 'sepia':
            filterStyle = 'sepia(100%)';
            break;
        case 'invert':
            filterStyle = 'invert(100%)';
            break;
        case 'blur':
            filterStyle = 'blur(2px)';
            break;
        default:
            filterStyle = 'none';
    }
    
    cameraDevice.style.filter = filterStyle;
}

// If takePhotoButton clicked => Take and display a photo
takePhotoButton.onclick = function() {
    cameraView.width = cameraDevice.videoWidth;
    cameraView.height = cameraDevice.videoHeight;
    cameraView.getContext("2d").drawImage(cameraDevice, 0, 0);
    const photoData = cameraView.toDataURL("image/webp");
    photoDisplay.src = photoData;
    photoDisplay.classList.add("photo-taken");
    
    // Add to gallery
    photoGallery.push({
        id: Date.now(),
        data: photoData,
        timestamp: new Date().toISOString()
    });
    saveGallery();
    
    // Show controls
    downloadPhotoButton.style.display = "flex";
    photoPreviewControls.style.display = "flex";
};

// If Front/Back camera is click => Change to front/back camera accordingly
frontCameraButton.onclick = function() {
    // Toggle the frontCamera variable
    frontCamera = !frontCamera;
    // Setup the button text
    const buttonText = frontCameraButton.querySelector('span');
    if (frontCamera) {
        buttonText.textContent = "Back Camera";
    }
    else {
        buttonText.textContent = "Front Camera";
    }
    // Start the video streaming
    cameraStart();
};

// Download photo to device
downloadPhotoButton.onclick = function() {
    const timestamp = new Date().getTime();
    const filename = `camera-photo-${timestamp}.webp`;
    
    const link = document.createElement('a');
    link.href = photoDisplay.src;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const originalText = downloadPhotoButton.querySelector('span').textContent;
    downloadPhotoButton.querySelector('span').textContent = 'Saved!';
    setTimeout(function() {
        downloadPhotoButton.querySelector('span').textContent = originalText;
    }, 2000);
};

// Delete current photo
deletePhotoButton.onclick = function() {
    photoDisplay.classList.remove("photo-taken");
    photoDisplay.src = "";
    downloadPhotoButton.style.display = "none";
    photoPreviewControls.style.display = "none";
    
    // Remove last photo from gallery
    if (photoGallery.length > 0) {
        photoGallery.pop();
        saveGallery();
    }
};

// Toggle flash/torch
flashButton.onclick = function() {
    flashEnabled = !flashEnabled;
    if (currentStream) {
        const track = currentStream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
            track.applyConstraints({
                advanced: [{ torch: flashEnabled }]
            }).catch(err => console.log("Flash not supported", err));
        }
    }
    flashButton.classList.toggle('active', flashEnabled);
};

// Open gallery
galleryButton.onclick = function() {
    renderGallery();
    galleryModal.style.display = 'flex';
};

// Close gallery
closeGalleryButton.onclick = function() {
    galleryModal.style.display = 'none';
};

// Render gallery
function renderGallery() {
    if (photoGallery.length === 0) {
        galleryContent.innerHTML = '<p class="empty-gallery">No photos yet. Start capturing!</p>';
        return;
    }
    
    galleryContent.innerHTML = '';
    photoGallery.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${photo.data}" alt="Photo ${index + 1}">
            <div class="gallery-item-actions">
                <button class="gallery-action-btn" onclick="downloadGalleryPhoto(${photo.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                </button>
                <button class="gallery-action-btn delete" onclick="deleteGalleryPhoto(${photo.id})">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        galleryContent.appendChild(item);
    });
}

// Download photo from gallery
function downloadGalleryPhoto(photoId) {
    const photo = photoGallery.find(p => p.id === photoId);
    if (photo) {
        const link = document.createElement('a');
        link.href = photo.data;
        link.download = `camera-photo-${photoId}.webp`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Delete photo from gallery
function deleteGalleryPhoto(photoId) {
    photoGallery = photoGallery.filter(p => p.id !== photoId);
    saveGallery();
    renderGallery();
}

// Zoom controls
zoomSlider.oninput = function() {
    applyZoom(parseFloat(this.value));
};

zoomInButton.onclick = function() {
    const newZoom = Math.min(parseFloat(zoomSlider.max), currentZoom + 0.5);
    zoomSlider.value = newZoom;
    applyZoom(newZoom);
};

zoomOutButton.onclick = function() {
    const newZoom = Math.max(parseFloat(zoomSlider.min), currentZoom - 0.5);
    zoomSlider.value = newZoom;
    applyZoom(newZoom);
};

// Filter controls
filterButtons.forEach(button => {
    button.onclick = function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        applyFilter(this.dataset.filter);
    };
});

// Start the camera and video streaming when the window loads
window.addEventListener("load", function() {
    loadGallery();
    cameraStart();
});

