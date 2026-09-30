import { app } from './app';
import { env } from './config/env';

const PORT = env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  AAJORI CUISINE - HYPERLOCAL FOOD COMMERCE BACKEND   `);
    console.log(`  District: ${env.DEFAULT_DISTRICT}, Assam, India      `);
    console.log(`  Environment: ${env.NODE_ENV}                         `);
    console.log(`  Listening on: http://localhost:${PORT}               `);
    console.log(`  API Root: http://localhost:${PORT}${env.API_PREFIX}  `);
    console.log(`=======================================================`);
  });
}

export default app;
