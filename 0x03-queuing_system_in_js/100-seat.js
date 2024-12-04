import express from 'express';
import kue from 'kue';
import redis from 'redis';
import { promisify } from 'util';

const app = express();
const port = 1245;

const queue = kue.createQueue();
const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

let reservationEnabled = true;

async function reserveSeat(number) {
  await setAsync('available_seats', number);
}

async function getCurrentAvailableSeats() {
  const seats = await getAsync('available_seats');
  return parseInt(seats, 10) || 0;
}

app.get('/available_seats', async (req, res) => {
  const seats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats: seats });
});

app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    return res.json({ status: 'Reservation are blocked' });
  }

  const job = queue.create('reserve_seat');

  job
    .on('complete', () => console.log(`Seat reservation job ${job.id} completed`))
    .on('failed', (err) => console.log(`Seat reservation job ${job.id} failed: ${err}`));

  job.save((err) => {
    if (!err) {
      res.json({ status: 'Reservation in process' });
    } else {
      res.json({ status: 'Reservation failed' });
    }
  });
});

app.get('/process', async (req, res) => {
  res.json({ status: 'Queue processing' });

  queue.process('reserve_seat', async (job, done) => {
    const seats = await getCurrentAvailableSeats();

    if (seats <= 0) {
      reservationEnabled = false;
      return done(new Error('Not enough seats available'));
    }

    await reserveSeat(seats - 1);

    if (seats - 1 === 0) {
      reservationEnabled = false;
    }

    done();
  });
});

reserveSeat(50); // Initialize seats
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

