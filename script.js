document.addEventListener('DOMContentLoaded', () => {
    const imageGrid = document.getElementById('image-grid');
    const folderGrid = document.getElementById('folder-grid');

    if (folderGrid) {
        displayFolders();
    } else if (imageGrid) {
        displayImages();
    }
});

function displayFolders() {
    const folderGrid = document.getElementById('folder-grid');
    folders.forEach((folder, index) => {
        const folderItem = document.createElement('a');
        folderItem.className = 'grid-item';
        folderItem.href = `folder.html?folder=${index}`;

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const img = document.createElement('img');
        img.src = folder.images[0].path; 
        img.alt = folder.name;
        img.classList.add('loaded');

        imageContainer.appendChild(img);

        const title = document.createElement('div');
        title.className = 'image-title';
        title.textContent = folder.name;

        folderItem.appendChild(imageContainer);
        folderItem.appendChild(title);
        folderGrid.appendChild(folderItem);
    });
}

function displayImages() {
    const urlParams = new URLSearchParams(window.location.search);
    const folderIndex = parseInt(urlParams.get('folder'), 10);
    const folder = folders[folderIndex];

    if (!folder) {
        // Handle case where folder is not found
        document.getElementById('folder-title').textContent = "Folder not found";
        return;
    }

    document.getElementById('folder-title').textContent = folder.name;

    const imageGrid = document.getElementById('image-grid');
    const images = folder.images;

    images.forEach((imageData, index) => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.index = index;

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        const img = document.createElement('img');
        img.dataset.src = imageData.path;
        img.alt = imageData.title;

        imageContainer.appendChild(img);

        const title = document.createElement('div');
        title.className = 'image-title';
        title.textContent = imageData.title;

        gridItem.appendChild(imageContainer);
        gridItem.appendChild(title);
        imageGrid.appendChild(gridItem);
    });
    
    setupImageOverlay(images);
    setupLazyLoading();
}

function setupImageOverlay(images) {
    const imageOverlay = document.getElementById('image-overlay');
    const closeButton = document.querySelector('.close-button');
    const overlayImage = document.getElementById('overlay-image');
    const overlayTitle = document.getElementById('overlay-title');
    const downloadButton = document.getElementById('download-button');
    const overlayInfoPanel = document.getElementById('overlay-info-panel');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    let currentImageIndex = 0;

    async function showImage(index) {
        if (index < 0 || index >= images.length) {
            return;
        }
        currentImageIndex = index;
        const imageData = images[index];
        overlayInfoPanel.innerHTML = '<p>Loading info...</p>';
        overlayInfoPanel.style.display = 'block';
        overlayImage.src = imageData.path;
        overlayImage.alt = imageData.title;
        overlayTitle.textContent = imageData.title;
        downloadButton.href = imageData.path;
        const metadata = await getImageMetadata(imageData.path);
        overlayInfoPanel.innerHTML = '';
        const metadataP = document.createElement('p');
        metadataP.innerHTML = `<strong>Dimensions:</strong> ${metadata.dimensions.w} x ${metadata.dimensions.h}<br><strong>File Size:</strong> ${metadata.fileSize}`;
        overlayInfoPanel.appendChild(metadataP);

        if (imageData.info) {
            for (const key in imageData.info) {
                const p = document.createElement('p');
                p.innerHTML = `<strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${imageData.info[key]}`;
                overlayInfoPanel.appendChild(p);
            }
        } else if (!metadata.fileSize) {
            overlayInfoPanel.style.display = 'none';
        }
        prevButton.classList.toggle('hidden', currentImageIndex === 0);
        nextButton.classList.toggle('hidden', currentImageIndex === images.length - 1);
    }
    document.getElementById('image-grid').addEventListener('click', (event) => {
        const gridItem = event.target.closest('.grid-item');
        if (gridItem) {
            const index = parseInt(gridItem.dataset.index, 10);
            showImage(index);
            imageOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });
    prevButton.addEventListener('click', () => showImage(currentImageIndex - 1));
    nextButton.addEventListener('click', () => showImage(currentImageIndex + 1));
    const closeOverlay = () => {
        imageOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    closeButton.addEventListener('click', closeOverlay);
    imageOverlay.addEventListener('click', (e) => e.target === imageOverlay && closeOverlay());
    document.addEventListener('keydown', (e) => {
        if (!imageOverlay.classList.contains('active')) return;
        if (e.key === 'Escape') closeOverlay();
        else if (e.key === 'ArrowLeft') showImage(currentImageIndex - 1);
        else if (e.key === 'ArrowRight') showImage(currentImageIndex + 1);
    });
}

function setupLazyLoading() {
    const lazyImages = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '100px' });

    lazyImages.forEach(img => imageObserver.observe(img));
}


async function getImageMetadata(path) {
    try {
        const img = new Image();
        img.src = path;
        await img.decode();
        const dimensions = { w: img.naturalWidth, h: img.naturalHeight };
        const response = await fetch(path, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        const fileSize = size ? formatBytes(parseInt(size)) : 'Unknown';
        return { dimensions, fileSize };
    } catch (error) {
        console.error("Could not fetch image metadata:", error);
        return { dimensions: { w: 'N/A', h: 'N/A' }, fileSize: 'N/A' };
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}