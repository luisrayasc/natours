/* eslint-disable */
export const displayMap = (locations) => {
    mapboxgl.accessToken =
        'pk.eyJ1IjoibHVpc3JheWFzYyIsImEiOiJjajRmeTRoZjIxYWtjMnF0ZmthNWd3ZWpmIn0.QkaHLen9gHVxqXbpjdzMmw';

    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/luisrayasc/ckrxx1e8728h117qk5c8bzq03',
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
        const el = document.createElement('div');
        el.className = 'marker';

        new mapboxgl.Popup({
            anchor: 'top-right',
            closeOnClick: false,
            closeButton: false,
        })
            .setText(`Day: ${location.day} | ${location.description}`)
            .setLngLat(location.coordinates)
            .addTo(map);

        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom',
        })
            .setLngLat(location.coordinates)
            .addTo(map);

        bounds.extend(location.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 200,
            left: 200,
            right: 200,
        },
    });
};
