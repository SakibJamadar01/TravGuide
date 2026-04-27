const API_BASE_URL = 'http://localhost:8080';

async function fetchGuides(city = "") {
    try {
        // 1. Decide which URL to call
        let url = `${API_BASE_URL}/api/guides`;
        if (city) {
            url = `${API_BASE_URL}/api/guides/search?city=${city}`;
        }

        const response = await fetch(url);
        const guides = await response.json();
        
        const listElement = document.getElementById('guide-list');
        if (listElement) {
            listElement.innerHTML = ''; // Clear the "Loading..." text

            if (guides.length === 0) {
                listElement.innerHTML = '<p>No guides found yet. Add some in the database!</p>';
            } else {
                guides.forEach(guide => {
                    const card = `
                        <div class="guide-card">
                            <h3>${guide.name}</h3>
                            <p><strong>City:</strong> ${guide.city}</p>
                            <p>${guide.bio}</p>
                            <p class="price">$${guide.pricePerDay} / day</p>
                            <button class="book-btn">Contact Guide</button>
                        </div>
                    `;
                    listElement.innerHTML += card;

                    // 4. Add Marker on Map
                    if (map && guide.latitude && guide.longitude) {
                        L.marker([guide.latitude, guide.longitude])
                            .addTo(map)
                            .bindPopup(`<b>${guide.name}</b><br>${guide.city}`);
                    }
                });

                // 6. If we found guides, zoom the map to the first one!
                if (map && guides.length > 0 && guides[0].latitude) {
                    map.setView([guides[0].latitude, guides[0].longitude], 10);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching guides:", error);
    }
}

// Fetch guides as soon as the page loads
window.onload = () => fetchGuides();


// Handle Registration Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page from refreshing

        // 1. Collect data from inputs
        const guideData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            city: document.getElementById('city').value,
            bio: document.getElementById('bio').value,
            pricePerDay: parseFloat(document.getElementById('price').value),
            latitude: parseFloat(document.getElementById('lat').value),
            longitude: parseFloat(document.getElementById('lng').value),
            rating: 5.0
        };


        // 2. Send data to the Java Backend
        try {
            const response = await fetch(`${API_BASE_URL}/api/guides`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(guideData)
            });

            if (response.ok) {
                alert("Guide registered successfully!");
                window.location.href = 'index.html'; // Go back to home to see the new guide
            } else {
                alert("Error registering guide. Check backend logs.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });
}

let map; // Global variable to store the map instance

// Initialize Map if it doesn't exist
function initMap() {
    const mapElement = document.getElementById('map');
    if (mapElement && !map) {
        map = L.map('map').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
    }
}

// Initialize Picker Map for Registration
const pickerMapElement = document.getElementById('picker-map');
if (pickerMapElement) {
    const pMap = L.map('picker-map').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pMap);

    let marker;
    pMap.on('click', function(e) {
        if (marker) pMap.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(pMap);
        
        // Save the coordinates to hidden inputs
        document.getElementById('lat').value = e.latlng.lat;
        document.getElementById('lng').value = e.latlng.lng;
    });
}

// Run map init on load
if (document.getElementById('map')) {
    initMap();
}

