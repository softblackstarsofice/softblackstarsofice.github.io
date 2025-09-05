document.addEventListener('DOMContentLoaded', () => {
    const images = [
{
            title: "Untitled",
            path: "images/untitled1.jpg",
        },
        {
            title: "Untitled",
            path: "images/untitled2.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled3.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled4.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled5.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled6.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled7.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled8.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled9.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled10.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled11.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled12.jpg"
        },
        {
            title: "Untitled",
            path: "images/untitled13.jpg"
        },
    ];
    
    const imageGrid = document.getElementById('image-grid');
    const imageOverlay = document.getElementById('image-overlay');
    const closeButton = document.querySelector('.close-button');
    const overlayImage = document.getElementById('overlay-image');
    const overlayTitle = document.getElementById('overlay-title');
    const downloadButton = document.getElementById('download-button');
    const overlayInfoPanel = document.getElementById('overlay-info-panel');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');

    let currentImageIndex = 0;

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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

    imageGrid.addEventListener('click', (event) => {
        const gridItem = event.target.closest('.grid-item');
        if (gridItem) {
            const index = parseInt(gridItem.dataset.index, 10);
            showImage(index);
            imageOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    prevButton.addEventListener('click', () => {
        showImage(currentImageIndex - 1);
    });

    nextButton.addEventListener('click', () => {
        showImage(currentImageIndex + 1);
    });

    function closeOverlay() {
        imageOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeButton.addEventListener('click', closeOverlay);
    imageOverlay.addEventListener('click', (event) => {
        if (event.target === imageOverlay) closeOverlay();
    });

    document.addEventListener('keydown', (event) => {
        if (!imageOverlay.classList.contains('active')) return;
        
        if (event.key === 'Escape') {
            closeOverlay();
        } else if (event.key === 'ArrowLeft') {
            showImage(currentImageIndex - 1);
        } else if (event.key === 'ArrowRight') {
            showImage(currentImageIndex + 1);
        }
    });
});