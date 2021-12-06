import { loadEnv } from 'vite';

export function injectEnvVariable() {
  Object.assign(process.env, loadEnv(process.env.MODE, process.cwd()), {
    __DARWIN__ : process.platform === 'darwin',
    __WIN32__ : process.platform === 'win32',
    __LINUX__ : process.platform === 'linux',
  });
  return '__';
}
