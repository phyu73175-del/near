// utils/distance.js
const calculateDistance = (userLat, userLng, propertyLat, propertyLng) => {
  const earthRadius = 6371; // km

  const distance =
    earthRadius *
    Math.acos(
      Math.cos(toRadians(userLat)) *
        Math.cos(toRadians(propertyLat)) *
        Math.cos(toRadians(propertyLng) - toRadians(userLng)) +
        Math.sin(toRadians(userLat)) *
        Math.sin(toRadians(propertyLat))
    );

  return Number(distance.toFixed(2));
};

const toRadians = (degree) => {
  return degree * (Math.PI / 180);
};

module.exports = {calculateDistance};