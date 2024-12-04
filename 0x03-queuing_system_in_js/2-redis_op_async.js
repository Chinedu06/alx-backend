import redis from 'redis';
import { promisify } from 'util';

// Create a Redis client
const client = redis.createClient();

// Event listener for successful connection
client.on('connect', () => {
  console.log('Redis client connected to the server');
});

// Event listener for errors
client.on('error', (err) => {
  console.log(`Redis client not connected to the server: ${err.message}`);
});

// Function to set a new key-value pair in Redis
function setNewSchool(schoolName, value) {
  client.set(schoolName, value, redis.print); // redis.print logs the response
}

// Promisify the get method
const getAsync = promisify(client.get).bind(client);

// Async function to get and display the value of a key
async function displaySchoolValue(schoolName) {
  try {
    const value = await getAsync(schoolName);
    console.log(value);
  } catch (err) {
    console.error(`Error retrieving value for ${schoolName}: ${err.message}`);
  }
}

// Call the functions
(async () => {
  await displaySchoolValue('Holberton'); // Logs the value or null if not set
  setNewSchool('HolbertonSanFrancisco', '100'); // Sets the value and logs confirmation
  await displaySchoolValue('HolbertonSanFrancisco'); // Logs "100"
})();
