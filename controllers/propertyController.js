// const pool = require('../db/database');

// const propertyController = {
//   // Get all properties
//   getAllProperties: async (req, res) => {
//     try {
//     const query = `
//     SELECT 
//     p.id, 
//     p.title, 
//     p.location, 
//     p.price::numeric::float8 AS price,
//     p.rating, 
//     p.image_url,
//     COALESCE(
//         json_agg(
//             DISTINCT jsonb_build_object(
//                 'id', t.id,
//                 'name', t.name
//             )
//         ) FILTER (WHERE t.id IS NOT NULL),
//         '[]'
//     ) AS tags
// FROM properties p
// LEFT JOIN property_tags pt ON p.id = pt.property_id
// LEFT JOIN tags t ON pt.tag_id = t.id
// GROUP BY p.id
// ORDER BY p.id;
//       `;
//     const result = await pool.query(query);
//          // Format the response
//          const formattedProperties = result.rows.map(property => ({
//             ...property,
//             tags: property.tags.map(tag => tag.name)
//           }));
          
//           res.json(formattedProperties);
//     } catch (error) {
//       console.error('Error getting properties:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },

//   // Get property by ID
//   getPropertyById: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const query = `
//         SELECT 
//         p.id, 
//         p.title, 
//         p.location, 
//         p.price, 
//         p.rating, 
//         p.image_url,
//         CASE 
//             WHEN COUNT(t.name) = 0 THEN ARRAY[]::VARCHAR[]
//             ELSE ARRAY_AGG(t.name)
//         END as tags
//         FROM properties p
//         LEFT JOIN property_tags pt ON p.id = pt.property_id
//         LEFT JOIN tags t ON pt.tag_id = t.id
//         WHERE p.id = $1
//         GROUP BY p.id, p.title, p.location, p.price, p.rating, p.image_url;
//       `;
      
//       const result = await pool.query(query, [id]);
      
//       if (result.rows.length === 0) {
//         return res.status(404).json({ error: 'Property not found' });
//       }
      
//       res.json(result.rows[0]);
//     } catch (error) {
//       console.error('Error getting property:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   },

//   // Create new property
//   createProperty: async (req, res) => {
//     const client = await pool.connect();
//     try {
//       await client.query('BEGIN');
      
//       const { title, location, price, rating, imageUrl, tags } = req.body;
      
//       // Insert property
//       const propertyQuery = `
//         INSERT INTO properties (title, location, price, rating, image_url)
//         VALUES ($1, $2, $3, $4, $5)
//         RETURNING id
//       `;
//       const propertyResult = await client.query(propertyQuery, 
//         [title, location, price, rating, imageUrl]
//       );
//       const propertyId = propertyResult.rows[0].id;

//       // Insert or get tags and create relationships
//       for (const tagName of tags) {
//         // Insert tag if it doesn't exist
//         const tagQuery = `
//           INSERT INTO tags (name)
//           VALUES ($1)
//           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
//           RETURNING id
//         `;
//         const tagResult = await client.query(tagQuery, [tagName]);
//         const tagId = tagResult.rows[0].id;

//         // Create property-tag relationship
//         await client.query(
//           'INSERT INTO property_tags (property_id, tag_id) VALUES ($1, $2)',
//           [propertyId, tagId]
//         );
//       }

//       await client.query('COMMIT');
//       res.status(201).json({ id: propertyId, ...req.body });
//     } catch (error) {
//       await client.query('ROLLBACK');
//       console.error('Error creating property:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     } finally {
//       client.release();
//     }
//   },

//   // Get all tags
//   getAllTags: async (req, res) => {
//     try {
//       const result = await pool.query('SELECT * FROM tags ORDER BY name');
//       res.json(result.rows);
//     } catch (error) {
//       console.error('Error getting tags:', error);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   }
// };

// module.exports = propertyController;

const pool = require('../db/database');

const propertyController = {
  // Get all properties
  getAllProperties: async (req, res) => {
    try {
      const query = `
        SELECT 
          p.id, 
          p.title, 
          p.location, 
          p.price::numeric::float8, 
          p.rating, 
          p.image_url,
          ARRAY_REMOVE(ARRAY_AGG(t.name), NULL) as tags
        FROM properties p
        LEFT JOIN property_tags pt ON p.id = pt.property_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        GROUP BY 
          p.id, 
          p.title, 
          p.location, 
          p.price, 
          p.rating, 
          p.image_url
        ORDER BY p.id;
      `;
      
      const result = await pool.query(query);
      
      // Format the response
      const formattedProperties = result.rows.map(property => ({
        ...property,
        tags: property.tags || []
      }));
      
      res.json(formattedProperties);
    } catch (error) {
      console.error('Error getting properties:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get property by ID
  getPropertyById: async (req, res) => {
    try {
      const { id } = req.params;
      const query = `
        SELECT 
          p.id, 
          p.title, 
          p.location, 
          p.price::numeric::float8, 
          p.rating, 
          p.image_url,
          ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
        FROM properties p
        LEFT JOIN property_tags pt ON p.id = pt.property_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.id = $1
        GROUP BY 
          p.id, 
          p.title, 
          p.location, 
          p.price, 
          p.rating, 
          p.image_url;
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      
      // Format the response
      const property = result.rows[0];
      const formattedProperty = {
        ...property,
        tags: property.tags || []
      };
      
      res.json(formattedProperty);
    } catch (error) {
      console.error('Error getting property:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create new property
  createProperty: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { title, location, price, rating, imageUrl, tags } = req.body;
      
      // Insert property
      const propertyQuery = `
        INSERT INTO properties (title, location, price, rating, image_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, location, price, rating, image_url
      `;
      const propertyResult = await client.query(propertyQuery, 
        [title, location, price, rating, imageUrl]
      );
      const property = propertyResult.rows[0];

      // Insert or get tags and create relationships
      for (const tagName of tags) {
        const tagQuery = `
          INSERT INTO tags (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const tagResult = await client.query(tagQuery, [tagName]);

        // Create property-tag relationship
        await client.query(
          'INSERT INTO property_tags (property_id, tag_id) VALUES ($1, $2)',
          [property.id, tagResult.rows[0].id]
        );
      }

      await client.query('COMMIT');
      
      res.status(201).json({
        ...property,
        tags
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating property:', error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // Get all tags
  getAllTags: async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM tags ORDER BY name');
      res.json(result.rows);
    } catch (error) {
      console.error('Error getting tags:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete property
  deleteProperty: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;

      // Delete property (property_tags will be automatically deleted due to CASCADE)
      const deleteQuery = `
        DELETE FROM properties
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(deleteQuery, [id]);
      
      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Property not found' });
      }

      await client.query('COMMIT');
      res.json({ message: 'Property deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting property:', error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // Update property
  updateProperty: async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const { title, location, price, rating, imageUrl, tags } = req.body;

      // Update property
      const updateQuery = `
        UPDATE properties
        SET 
          title = $1,
          location = $2,
          price = $3,
          rating = $4,
          image_url = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, title, location, price, rating, image_url
      `;
      
      const result = await client.query(updateQuery, 
        [title, location, price, rating, imageUrl, id]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Property not found' });
      }

      const property = result.rows[0];

      // Delete existing tag relationships
      await client.query('DELETE FROM property_tags WHERE property_id = $1', [id]);

      // Insert new tags and create relationships
      for (const tagName of tags) {
        const tagQuery = `
          INSERT INTO tags (name)
          VALUES ($1)
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const tagResult = await client.query(tagQuery, [tagName]);

        // Create property-tag relationship
        await client.query(
          'INSERT INTO property_tags (property_id, tag_id) VALUES ($1, $2)',
          [property.id, tagResult.rows[0].id]
        );
      }

      await client.query('COMMIT');
      
      res.json({
        ...property,
        tags
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating property:', error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }
};

module.exports = propertyController;