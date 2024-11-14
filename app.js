// API Key สำหรับ HERE Maps
const apiKey = 'iSbgEEz4fCcm1N_FJGjs1Al2ICMFfV5aTwpJ3WfZUB8'; // กรุณาใส่ API Key ที่ได้จาก HERE

// สร้าง Platform และแผนที่
const platform = new H.service.Platform({
    apikey: apiKey,
    useHTTPS: true
});

const defaultLayers = platform.createDefaultLayers({
    lg: 'tha', // ภาษาไทย
    locale: 'th-TH' // การแสดงผลในรูปแบบของไทย
});

const map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
        zoom: 13,
        center: { lat: 13.736717, lng: 100.523186 } // Bangkok, Thailand
    }
);

// เพิ่มการจัดการเหตุการณ์บนแผนที่
const mapEvents = new H.mapevents.MapEvents(map);
const behavior = new H.mapevents.Behavior(mapEvents);
const ui = H.ui.UI.createDefault(map, defaultLayers);

// ประกาศตัวแปรสำหรับเส้นทาง
let routeLine = null;

// ฟังก์ชันการแปลงตำแหน่งจากชื่อสถานที่เป็นพิกัดโดยใช้ Geocoding API v7
function geocode(location, callback) {
    const geocoder = platform.getSearchService();
    geocoder.geocode({
        q: location,
        in: 'countryCode:THA',  // ระบุขอบเขตการค้นหาในประเทศไทย
        lang: 'th-TH',          // กำหนดภาษาไทย
        limit: 1               // จำกัดผลลัพธ์
    }, (result) => {
        if (result.items.length > 0) {
            callback(result.items[0].position);
        } else {
            alert('ไม่พบตำแหน่ง: ' + location);
        }
    }, (error) => {
        alert('เกิดข้อผิดพลาดในการค้นหา: ' + error.message);
    });
}// ฟังก์ชันการคำนวณเส้นทาง
function calculateRoute() {
    const startLocation = document.getElementById('start').value;
    const endLocation = document.getElementById('end').value;

    if (startLocation && endLocation) {
        geocode(startLocation, (startCoordinates) => {
            geocode(endLocation, (endCoordinates) => {
                // Using v8 routing API
                const routingUrl = `https://router.hereapi.com/v8/routes?apiKey=${apiKey}&transportMode=car&origin=${startCoordinates.lat},${startCoordinates.lng}&destination=${endCoordinates.lat},${endCoordinates.lng}&return=polyline`;
                
                fetch(routingUrl)
                    .then(response => response.json())
                    .then(result => {
                        if (result.routes && result.routes.length > 0) {
                            renderRouteOnMap(result.routes[0]);
                        }
                    })
                    .catch(error => {
                        alert('ไม่สามารถคำนวณเส้นทางได้: ' + error.message);
                    });
            });
        });
    } else {
        alert('กรุณาใส่ข้อมูลต้นทางและปลายทาง');
    }
}
// ฟังก์ชันแสดงเส้นทางบนแผนที่
function renderRouteOnMap(route) {
    if (routeLine) {
        map.removeObject(routeLine);
    }

    // Parse the polyline from v8 API response
    const routeShape = route.sections[0].polyline;
    const linestring = H.geo.LineString.fromFlexiblePolyline(routeShape);

    routeLine = new H.map.Polyline(linestring, {
        style: { strokeColor: 'blue', lineWidth: 4 }
    });

    map.addObject(routeLine);
    map.getViewModel().setLookAtData({ bounds: routeLine.getBoundingBox() });
}

function displayRouteInfo(route) {
    const distance = (route.length / 1000).toFixed(1); // แปลงเป็นกิโลเมตร
    const duration = Math.round(route.duration / 60); // แปลงเป็นนาที
    
    const routeInfo = document.createElement('div');
    routeInfo.innerHTML = `
        <h3>ข้อมูลเส้นทาง</h3>
        <p>ระยะทาง: ${distance} กิโลเมตร</p>
        <p>เวลาโดยประมาณ: ${duration} นาที</p>
    `;
    
    document.getElementById('routeInfo').appendChild(routeInfo);
}
