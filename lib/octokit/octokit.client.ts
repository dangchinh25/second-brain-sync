import { Octokit } from 'octokit';
import { env } from '../../config';

export const octokitClient = new Octokit( { auth: env.GITHUB_TOKEN } );
