const db = require("../config/db");

const getPagination = (page, limit) => {
  const pageNumber = Number(page) || 1;
  const limitNumber = Number(limit) || 20;
  const offset = (pageNumber - 1) * limitNumber;

  return { pageNumber, limitNumber, offset };
};

const validateLocation = (lat, lng, next) => {
  if (!lat || !lng) {
    const error = new Error("lat and lng are required");
    error.status = 400;
    return next(error);
  }

  if (isNaN(Number(lat)) || isNaN(Number(lng))) {
    const error = new Error("lat and lng must be numbers");
    error.status = 400;
    return next(error);
  }
};

// GET /api/nearby/all
const getAllNearby = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      const error = new Error("lat and lng are required");
      error.status = 400;
      return next(error);
    }
    const sql = `
WITH user_location AS (
  SELECT
    ? AS user_lat,
    ? AS user_lng
)
SELECT * FROM (
    SELECT
      p.id,
      p.title,
      (
      SELECT t.name
      FROM township t
      WHERE t.id = p.township_id
      ) AS location,
      (
        SELECT m.image_url
        FROM media m
        WHERE m.property_id = p.id
        ORDER BY m.id ASC
        LIMIT 1
      ) AS image,

      p.average_rating AS rating,
      'property' AS type,

      ROUND(
        (
          6371 * ACOS(
            COS(RADIANS(user_location.user_lat)) *
            COS(RADIANS(p.latitude)) *
            COS(RADIANS(p.longitude) - RADIANS(user_location.user_lng)) +
            SIN(RADIANS(user_location.user_lat)) *
            SIN(RADIANS(p.latitude))
          )
        ),
        2
      ) AS distance

    FROM properties p
    CROSS JOIN user_location

    WHERE p.post_status = 'APPROVED'

    UNION ALL

    SELECT
      c.id,
      c.title,
      (
      SELECT t.name
      FROM township t
      WHERE t.id = c.township_id
      ) AS location,

      (
        SELECT m.image_url
        FROM media m
        WHERE m.course_id = c.id
        ORDER BY m.id ASC
        LIMIT 1
      ) AS image,

      c.average_rating AS rating,
      'course' AS type,

      ROUND(
        (
          6371 * ACOS(
            COS(RADIANS(user_location.user_lat)) *
            COS(RADIANS(c.latitude)) *
            COS(RADIANS(c.longitude) - RADIANS(user_location.user_lng)) +
            SIN(RADIANS(user_location.user_lat)) *
            SIN(RADIANS(c.latitude))
          )
        ),
        2
      ) AS distance

    FROM course c
    CROSS JOIN user_location

    WHERE c.status = 'APPROVED'

) AS nearby_items

ORDER BY rating DESC
LIMIT 5
`;

    const [rows] = await db.query(sql, [
      Number(lat),
      Number(lng)
    ]);

    res.json({
      con: true,
      msg: "Top 5 highest rated properties and courses",
      result: rows
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/nearby?type=properties
const getNearbyByType = async (req, res, next) => {
  try {
    const { lat, lng, type, page = 1, limit = 20 } = req.query;

    if (!lat || !lng) {
      const error = new Error("lat and lng are required");
      error.status = 400;
      return next(error);
    }

    if (isNaN(Number(lat)) || isNaN(Number(lng))) {
      const error = new Error("lat and lng must be numbers");
      error.status = 400;
      return next(error);
    }

    if (!type) {
      const error = new Error("type is required");
      error.status = 400;
      return next(error);
    }

    if (!["properties", "course"].includes(type)) {
      const error = new Error("type must be properties or course");
      error.status = 400;
      return next(error);
    }

    const { pageNumber, limitNumber, offset } = getPagination(page, limit);

    let sql = "";

    if (type === "properties") {
      sql = `
        WITH user_location AS (
          SELECT ? AS user_lat, ? AS user_lng
        )

        SELECT
          p.id,
          p.title,
          p.price,
          (
          SELECT t.name
          FROM township t
          WHERE t.id = p.township_id
          ) AS location,
          p.average_rating AS rating,
          p.area_sqft,
          p.bedroom_count,

          (
            SELECT m.image_url
            FROM media m
            WHERE m.property_id = p.id
            ORDER BY m.id ASC
            LIMIT 1
          ) AS image,

          ROUND(
            6371 * ACOS(
              COS(RADIANS(user_location.user_lat)) *
              COS(RADIANS(p.latitude)) *
              COS(RADIANS(p.longitude) - RADIANS(user_location.user_lng)) +
              SIN(RADIANS(user_location.user_lat)) *
              SIN(RADIANS(p.latitude))
            ),
            2
          ) AS distance

        FROM properties p
        CROSS JOIN user_location
        WHERE p.post_status = 'APPROVED'
        ORDER BY distance ASC
        LIMIT ? OFFSET ?
      `;
    }

    if (type === "course") {
      sql = `
        WITH user_location AS (
          SELECT ? AS user_lat, ? AS user_lng
        )

        SELECT
          c.id,
          c.title,
          c.price,
          (
          SELECT t.name
          FROM township t
          WHERE t.id = c.township_id
          ) AS location,
          c.average_rating AS rating,
          c.duration,

          (
            SELECT m.image_url
            FROM media m
            WHERE m.course_id = c.id
            ORDER BY m.id ASC
            LIMIT 1
          ) AS image,

          ROUND(
            6371 * ACOS(
              COS(RADIANS(user_location.user_lat)) *
              COS(RADIANS(c.latitude)) *
              COS(RADIANS(c.longitude) - RADIANS(user_location.user_lng)) +
              SIN(RADIANS(user_location.user_lat)) *
              SIN(RADIANS(c.latitude))
            ),
            2
          ) AS distance

        FROM course c
        CROSS JOIN user_location
        WHERE c.status = 'APPROVED'
        ORDER BY distance ASC
        LIMIT ? OFFSET ?
      `;
    }

    const [rows] = await db.query(sql, [
      Number(lat),
      Number(lng),
      limitNumber,
      offset
    ]);

    res.json({
      con: true,
      msg: `Nearby ${type}`,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        count: rows.length
      },
      result: rows
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllNearby,
  getNearbyByType
};