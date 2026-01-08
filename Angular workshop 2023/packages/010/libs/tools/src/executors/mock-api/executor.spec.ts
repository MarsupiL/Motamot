import { MockApiExecutorSchema } from './schema';
import executor from './executor';

const options: MockApiExecutorSchema = {};

describe('MockApi Executor', () => {
  it('can run', async () => {
    const output = await executor(options);
    expect(output.success).toBe(true);
  });
});