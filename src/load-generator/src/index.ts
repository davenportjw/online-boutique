import axios from 'axios';

const FRONTEND_ADDR = process.env.FRONTEND_ADDR || 'http://frontend';

async function main() {
  while (true) {
    try {
      await axios.get(FRONTEND_ADDR);
    } catch (error) {
      console.error(error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();
