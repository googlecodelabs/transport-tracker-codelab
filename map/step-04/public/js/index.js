/* eslint-disable no-unused-vars, no-shadow-global */
/* globals google firebase */

const mapStyle = [
  {
    elementType: 'geometry',
    stylers: [
      {
        color: '#eceff1'
      }
    ]
  },
  {
    elementType: 'labels',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [
      {
        visibility: 'on'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      {
        color: '#cfd8dc'
      }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'road.local',
    stylers: [
      {
        visibility: 'off'
      }
    ]
  },
  {
    featureType: 'water',
    stylers: [
      {
        color: '#b0bec5'
      }
    ]
  }
];

function geocodeAddress(address, map, icon, title) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode(
    {
      address: address
    },
    (results, status) => {
      if (status === 'OK') {
        const marker = new google.maps.Marker({
          map: map,
          position: results[0].geometry.location,
          icon: icon,
          title: title
        });
      } else {
        console.log(
          'Geocode was not successful for the following reason: ' + status
        );
      }
    }
  );
}

class HotelMarkerManager {
  constructor(map) {
    this.map = map;
    this.hotelMarkers = [];
  }

  add(location, icon, title) {
    const marker = new google.maps.Marker({
      position: location,
      map: this.map,
      icon: icon,
      title: title
    });
    this.hotelMarkers.push(marker);
  }

  clear() {
    this.hotelMarkers.forEach(marker => {
      marker.setMap(null);
    });
    this.hotelMarkers.length = 0;
  }

  update(markers) {
    this.clear();
    markers.forEach(marker => {
      this.add(
        {
          lat: marker.lat,
          lng: marker.lng
        },
        marker.iconPath,
        marker.name
      );
    });
  }
}

class BusMarkerManager {
  constructor(map) {
    this.map = map;
    this.busLocationMarkers = {};
  }

  update(val) {
    for (let key in this.busLocationMarkers) {
      if (val === null || !(key in val)) {
        const marker = this.busLocationMarkers[key];
        marker.setMap(null);
        delete this.busLocationMarkers[key];
      }
    }

    for (let key in val) {
      const bus = val[key];

      if (key in this.busLocationMarkers) {
        const marker = this.busLocationMarkers[key];
        marker.setPosition({
          lat: bus.lat,
          lng: bus.lng
        });
      } else {
        const url = this.colorToBusMarker(bus.route_color);
        const marker = new google.maps.Marker({
          position: {
            lat: bus.lat,
            lng: bus.lng
          },
          map: this.map,
          icon: {
            url,
            anchor: new google.maps.Point(18, 18)
          },
          title: bus.route_name
        });
        this.busLocationMarkers[key] = marker;
      }
    }
  }

  colorToBusMarker(color) {
    switch (color) {
      case '86D1D8':
        return '/images/dashboard/busmarker_blue.png';
      case '445963':
        return '/images/dashboard/busmarker_gray.png';
      case '7BB241':
        return '/images/dashboard/busmarker_green.png';
      case '5D6ABF':
        return '/images/dashboard/busmarker_indigo.png';
      case 'A8D84E':
        return '/images/dashboard/busmarker_lime.png';
      case 'FCBBCB':
        return '/images/dashboard/busmarker_pink.png';
      case 'FF5151':
        return '/images/dashboard/busmarker_red.png';
      case '25C5D9':
        return '/images/dashboard/busmarker_sf1.png';
      case 'FF4081':
        return '/images/dashboard/busmarker_sf2.png';
      case 'FFC927':
        return '/images/dashboard/busmarker_yellow.png';
    }
  }
}

function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    disableDefaultUI: true,
    styles: mapStyle
  });

  // Put I/O on the map
  geocodeAddress(
    '1 Amphitheatre Pkwy, Mountain View, CA 94043',
    map,
    '/images/dashboard/logo_io_64.png',
    'Google I/O'
  );

  const busMarkerManager = new BusMarkerManager(map);
  const hotelMarkerManager = new HotelMarkerManager(map);
  const displayTimeElement = document.querySelector('#display-time');
  const pageMarkerPanelElts = [
    document.querySelector('#page-marker-panel-0'),
    document.querySelector('#page-marker-panel-1'),
    document.querySelector('#page-marker-panel-2')
  ];
  const db = firebase.database();

  db.ref('current-time').on('value', snapshot => {
    displayTimeElement.textContent = snapshot.val().display;
  });

  db.ref('map').on('value', snapshot => {
    const val = snapshot.val();
    map.fitBounds({
      east: val.northEastLng,
      north: val.northEastLat,
      south: val.southWestLat,
      west: val.southWestLng
    });

    hotelMarkerManager.update(val.markers);

    pageMarkerPanelElts.forEach(elt => {
      elt.classList.remove('selected');
    });
    pageMarkerPanelElts[val.panel].classList.add('selected');
  });

  db.ref('bus-locations').on('value', snapshot => {
    busMarkerManager.update(snapshot.val());
  });
}
