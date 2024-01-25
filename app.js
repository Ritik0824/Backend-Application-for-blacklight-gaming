const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
app.use(express.json());

// Connect to MySQL database
const sequelize = new Sequelize('project', 'root', 'Ritik@1234', {
  host: 'localhost',
  dialect: 'mysql',
});

// Define the Leaderboard model
const Leaderboard = sequelize.define('data', {
  UID: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  Name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  Score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Country: {
    type: DataTypes.STRING(2),
    allowNull: false,
  },
  TimeStamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: false, // Disable automatic createdAt and updatedAt columns
});


// Display current week leaderboard (Top 200)
app.get('/api/current_week_leaderboard', async (req, res) => {
    const end_date = new Date();
    const start_date = new Date(end_date);
    start_date.setDate(end_date.getDate() - end_date.getDay());
    start_date.setHours(0, 0, 0, 0); // Set the time to the start of the day
  
    const leaderboard = await sequelize.query(
      `SELECT * FROM data WHERE DATE(TimeStamp) BETWEEN :startDate AND :endDate ORDER BY Score DESC LIMIT 200`,
      {
        replacements: {
          startDate: start_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: end_date.toISOString().split('T')[0],     // Format as YYYY-MM-DD
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
  
    res.json(leaderboard);
  });
  

// Display last week leaderboard given a country by the user (Top 200)
app.get('/api/last_week_leaderboard/:country', async (req, res) => {
  try {
   const { country } = req.params;
    const currentDate = new Date();
    const lastWeekStartDate = new Date(currentDate);
    lastWeekStartDate.setDate(currentDate.getDate() - 7);
    console.log(lastWeekStartDate);
    console.log(currentDate);

    // const lb = await Leaderboard.findAll({
    //   where: {
    //     Country: country,
    //     TimeStamp: {
    //       [Sequelize.Op.between]: [lastWeekStartDate, currentDate],
    //     },
    //   },
    //   order: [['Score', 'DESC']],
    //   limit: 200,
    // });
    
    // const generatedQuery = sequelize.query('SELECT * FROM `data` WHERE `data`.`Country` = :country AND `data`.`TimeStamp` BETWEEN :startDate AND :endDate ORDER BY `data`.`Score` DESC LIMIT 200', {
    //   replacements: {
    //     country: country,
    //     startDate: lastWeekStartDate,
    //     endDate: currentDate,
    //   },
    //   type: Sequelize.QueryTypes.SELECT,
    // });
    
    // console.log('Generated Query:', generatedQuery);
    
    // res.json(leaderboard);
    // const lb = await Leaderboard.findAll({
    //   where: {
    //     Country: country,
    //     TimeStamp: {
    //       [Sequelize.Op.between]: [lastWeekStartDate, currentDate],
    //     },
    //   },
    //   order: [['Score', 'DESC']],
    //   limit: 200,
    // });
    const leaderboard = await sequelize.query(
      `SELECT * FROM data WHERE Country = :country AND DATE(TimeStamp) BETWEEN :startDate AND :endDate ORDER BY Score DESC LIMIT 200`,
      {
        replacements: {
          country: country, // Use the correct country value here
          startDate: lastWeekStartDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: currentDate.toISOString().split('T')[0],       // Format as YYYY-MM-DD
        },
        type: Sequelize.QueryTypes.SELECT,
      }
    );
    
  
    res.json(leaderboard);

  } catch (error) {
    console.error('Error fetching last week leaderboard:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Fetch user rank, given the userId
app.get('/api/user_rank/:uid', async (req, res) => {
    const uid = req.params.uid;
  
    console.log('Searching for user with UID:', uid);
  
    try {
      const user = await Leaderboard.findOne({
        where: { UID: uid },
      });
  
      console.log('User:', user); // Log the user object to check if it's retrieved correctly
  
      if (user) {
        const userRank = await Leaderboard.count({
          where: {
            Score: {
              [Sequelize.Op.gte]: user.Score,
            },
          },
        });
  
        console.log('User found. User Rank:', userRank + 1);
  
        res.json({ UID: uid, Rank: userRank + 1 });
      } else {
        console.log('User not found.');
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
  
  
app.get('/', (req, res) => {
    res.send('Welcome to the Leaderboard API!');
  });

// Sync the database and start the server
sequelize.sync()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  })
  .catch((error) => {
    console.error('Error syncing the database:', error);
  });
