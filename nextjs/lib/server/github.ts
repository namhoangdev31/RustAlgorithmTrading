import { cookies } from "next/headers";
import { Octokit } from "octokit";

export type GithubRepoSummary = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  defaultBranch: string;
  private: boolean;
  updatedAt: string;
};

export type GithubOverviewData = {
  connected: boolean;
  login?: string;
  avatarUrl?: string;
  profileUrl?: string;
  repos: GithubRepoSummary[];
  error?: string;
};

export async function getGithubOverviewData(): Promise<GithubOverviewData> {
  const cookieStore = await cookies();
  const token = cookieStore.get("github_access_token")?.value;

  if (!token) {
    return { connected: false, repos: [] };
  }

  try {
    const octokit = new Octokit({ auth: token });

    const [{ data: profile }, { data: repos }] = await Promise.all([
      octokit.rest.users.getAuthenticated(),
      octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 20,
        affiliation: "owner,collaborator",
      }),
    ]);

    return {
      connected: true,
      login: profile.login,
      avatarUrl: profile.avatar_url,
      profileUrl: profile.html_url,
      repos: repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        private: repo.private,
        updatedAt: repo.updated_at ?? new Date(0).toISOString(),
      })),
    };
  } catch {
    return {
      connected: false,
      repos: [],
      error: "Unable to load GitHub repositories.",
    };
  }
}
