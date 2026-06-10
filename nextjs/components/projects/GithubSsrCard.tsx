import { Octokit } from "octokit";
import { decryptSecret } from "@/lib/server/secret-crypto";
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  Star, 
  GitFork, 
  AlertCircle, 
  ExternalLink,
  Info,
  Tag
} from "lucide-react";
import { GithubIcon } from "@/components/ui/icon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { formatRelativeTime } from "@/lib/shared/time";
import { Link } from "@/i18n/navigation";

interface GithubSsrCardProps {
  project: any;
  locale: string;
}

export async function GithubSsrCard({ project, locale }: GithubSsrCardProps) {
  const latestTrack = project.bundle?.releaseTracks?.[0];
  const githubIntegration = project.bundle?.externalIntegrations?.find(
    (i: any) => i.integrationType === "github" && i.isActive
  );

  if (!githubIntegration) {
    return (
      <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-base font-bold text-ink flex items-center gap-2">
            <GithubIcon className="size-5 text-ink-mute" />
            GitHub Integration
          </CardTitle>
          <CardDescription className="text-xs text-ink-mute">
            No GitHub repository is linked to this project.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 pt-2">
          <p className="text-xs text-ink-secondary mb-4 leading-relaxed">
            Link a GitHub repository to automatically track repository activities, commits, pull requests, and synchronize build details.
          </p>
          <Link
            href={`/projects/${project.id}?tab=settings`}
            className="h-9 inline-flex items-center justify-center text-xs font-semibold bg-canvas hover:bg-canvas-soft border border-hairline-strong text-ink rounded-sm px-4 shadow-light transition-colors"
          >
            Configure GitHub in Settings
          </Link>
        </CardContent>
      </Card>
    );
  }

  let configData: any = {};
  try {
    configData = JSON.parse(githubIntegration.config);
  } catch {
    return (
      <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-ink">Integration Error</h4>
            <p className="text-xs text-ink-mute mt-1">
              The configuration for this GitHub integration is invalid or corrupt.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { repoFullName, githubAccessToken } = configData;
  if (!repoFullName || !githubAccessToken) {
    return (
      <Card className="bg-canvas border border-hairline rounded-lg p-5">
        <div className="flex items-start gap-3">
          <Info className="size-5 text-ink-mute shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-ink">Incomplete Integration</h4>
            <p className="text-xs text-ink-mute mt-1">
              Please link a repository and verify your credentials.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const [owner, repo] = repoFullName.split("/");

  try {
    const token = decryptSecret(githubAccessToken);
    const octokit = new Octokit({ auth: token });

    const [repoRes, commitsRes, pullsRes, issuesRes, releasesRes] = await Promise.all([
      octokit.rest.repos.get({ owner, repo }),
      octokit.rest.repos.listCommits({ owner, repo, per_page: 5 }),
      octokit.rest.pulls.list({ owner, repo, state: "open", per_page: 5 }),
      octokit.rest.issues.listForRepo({ owner, repo, state: "open", per_page: 10 }),
      octokit.rest.repos.listReleases({ owner, repo, per_page: 5 }),
    ]);

    const repoInfo = repoRes.data;
    const commits = commitsRes.data;
    const pulls = pullsRes.data;
    const issues = issuesRes.data.filter((i: any) => !i.pull_request).slice(0, 5);
    const releases = releasesRes.data;

    return (
      <div className="space-y-6">
        {/* Repo Header & Stats */}
        <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
          <CardHeader className="px-0 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <GithubIcon className="size-5 text-ink shrink-0" />
                <CardTitle className="text-base font-bold text-ink flex items-center gap-1.5">
                  {repoInfo.name}
                  <a
                    href={repoInfo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink-mute hover:text-primary transition-colors inline-flex"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </CardTitle>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-canvas-soft border-hairline text-ink-mute font-mono flex items-center gap-1">
                  <GitBranch className="size-3 shrink-0" />
                  {repoInfo.default_branch}
                </span>
              </div>
              <CardDescription className="text-xs text-ink-mute leading-relaxed max-w-2xl">
                {repoInfo.description || "No description provided for this repository."}
              </CardDescription>
            </div>
          </CardHeader>

          <Separator className="bg-hairline my-4" />

          <CardContent className="px-0 pb-0 grid grid-cols-3 gap-4">
            <div className="bg-canvas-soft/30 p-3 border border-hairline rounded-md flex items-center gap-3">
              <div className="size-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Star className="size-4" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-ink-mute tracking-wider">Stars</p>
                <p className="text-base font-bold text-ink font-mono mt-0.5">{repoInfo.stargazers_count.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-canvas-soft/30 p-3 border border-hairline rounded-md flex items-center gap-3">
              <div className="size-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <GitFork className="size-4" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-ink-mute tracking-wider">Forks</p>
                <p className="text-base font-bold text-ink font-mono mt-0.5">{repoInfo.forks_count.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-canvas-soft/30 p-3 border border-hairline rounded-md flex items-center gap-3">
              <div className="size-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-ink-mute tracking-wider">Open Issues</p>
                <p className="text-base font-bold text-ink font-mono mt-0.5">{repoInfo.open_issues_count.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingestion & Sync Pipeline Timeline */}
        {latestTrack && (
          <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm">
            <CardHeader className="px-0 pt-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      latestTrack.status === "completed" ? "bg-emerald-400" : "bg-amber-400"
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      latestTrack.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                    }`}></span>
                  </span>
                  {locale === "vi" 
                    ? `Tiến trình Nạp Gói Tự động — Build #${latestTrack.buildNumber}` 
                    : `Automated Ingestion Pipeline — Build #${latestTrack.buildNumber}`}
                </CardTitle>
                <CardDescription className="text-[10px] text-ink-mute mt-0.5">
                  {locale === "vi" 
                    ? `Theo dõi trạng thái nạp gói phát hành cho phiên bản v${latestTrack.version}`
                    : `Sync and compilation track for version v${latestTrack.version}`}
                </CardDescription>
              </div>
              <span className="text-[10px] font-mono text-ink-mute">
                {latestTrack.createdAt ? new Date(latestTrack.createdAt).toLocaleDateString() : ""}
              </span>
            </CardHeader>
            <Separator className="bg-hairline my-3" />
            <CardContent className="px-0 pb-0 pt-1">
              <div className="relative border-l border-hairline ml-3.5 pl-6 space-y-5 py-1 text-xs">
                {/* Step 1: Webhook Triggered */}
                <div className="relative">
                  <span className="absolute -left-10 top-0.5 size-7 rounded-full border border-hairline bg-canvas flex items-center justify-center text-[10px] text-primary font-bold">
                    ✓
                  </span>
                  <div>
                    <h5 className="font-semibold text-ink">Webhook Event Triggered</h5>
                    <p className="text-[10px] text-ink-mute mt-0.5">GitHub webhook received push/release tag for tag v{latestTrack.version}</p>
                  </div>
                </div>

                {/* Step 2: Download & Validation */}
                <div className="relative">
                  <span className="absolute -left-10 top-0.5 size-7 rounded-full border border-hairline bg-canvas flex items-center justify-center text-[10px] text-primary font-bold">
                    ✓
                  </span>
                  <div>
                    <h5 className="font-semibold text-ink">Package Bundle Verification</h5>
                    <p className="text-[10px] text-ink-mute mt-0.5">Successfully downloaded asset and verified bundle checksums.</p>
                  </div>
                </div>

                {/* Step 3: Database Registration */}
                <div className="relative">
                  <span className={`absolute -left-10 top-0.5 size-7 rounded-full border flex items-center justify-center text-[10px] font-bold bg-canvas ${
                    latestTrack.status === "completed" ? "border-hairline text-primary" : "border-amber-500/30 text-amber-500 animate-pulse"
                  }`}>
                    {latestTrack.status === "completed" ? "✓" : "⚡"}
                  </span>
                  <div>
                    <h5 className="font-semibold text-ink">Database Registration & Storage</h5>
                    <p className="text-[10px] text-ink-mute mt-0.5">
                      {latestTrack.status === "completed"
                        ? "Assets registered in core storage bucket and release track database record created."
                        : "Registering bundle assets and updating database records..."}
                    </p>
                  </div>
                </div>

                {/* Step 4: Pipeline Complete */}
                <div className="relative">
                  <span className={`absolute -left-10 top-0.5 size-7 rounded-full border flex items-center justify-center text-[10px] font-bold bg-canvas ${
                    latestTrack.status === "completed" ? "border-emerald-500/20 text-emerald-500" : "border-hairline text-ink-mute"
                  }`}>
                    {latestTrack.status === "completed" ? "✓" : "○"}
                  </span>
                  <div>
                    <h5 className={`font-semibold ${latestTrack.status === "completed" ? "text-emerald-500" : "text-ink-mute"}`}>
                      Ingestion Completed Successfully
                    </h5>
                    <p className="text-[10px] text-ink-mute mt-0.5">
                      {latestTrack.status === "completed"
                        ? `Build #${latestTrack.buildNumber} is active and ready for delivery.`
                        : "Waiting for database task compilation to complete..."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Commits & Pull Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commits Card */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col h-[350px]">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <GitCommit className="size-4 text-ink-mute" />
                  Recent Commits
                </CardTitle>
                <CardDescription className="text-[10px] text-ink-mute mt-0.5">
                  Latest repository code updates
                </CardDescription>
              </div>
            </CardHeader>
            <Separator className="bg-hairline my-3" />
            <CardContent className="px-0 pb-0 overflow-y-auto flex-1 space-y-3 pr-1">
              {commits.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-mute">No commits found.</div>
              ) : (
                commits.map((commit: any) => (
                  <div key={commit.sha} className="flex gap-3 text-xs border-b border-hairline pb-2.5 last:border-b-0 last:pb-0 hover:bg-canvas-soft/20 p-1 rounded-sm transition-colors">
                    <Avatar className="size-6 shrink-0 border border-hairline">
                      {commit.author?.avatar_url ? (
                        <AvatarImage src={commit.author.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                        {(commit.commit.author?.name || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold text-ink leading-snug truncate" title={commit.commit.message}>
                        {commit.commit.message}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-mute font-mono">
                        <span className="font-semibold text-ink-secondary">{commit.author?.login || commit.commit.author?.name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(commit.commit.author?.date), locale)}</span>
                        <span>•</span>
                        <a 
                          href={commit.html_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="hover:text-primary transition-colors"
                        >
                          {commit.sha.slice(0, 7)}
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pull Requests Card */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col h-[350px]">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <GitPullRequest className="size-4 text-ink-mute" />
                  Open Pull Requests
                </CardTitle>
                <CardDescription className="text-[10px] text-ink-mute mt-0.5">
                  Proposed code contributions
                </CardDescription>
              </div>
            </CardHeader>
            <Separator className="bg-hairline my-3" />
            <CardContent className="px-0 pb-0 overflow-y-auto flex-1 space-y-3 pr-1">
              {pulls.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-mute">No open pull requests.</div>
              ) : (
                pulls.map((pull: any) => (
                  <div key={pull.id} className="flex gap-3 text-xs border-b border-hairline pb-2.5 last:border-b-0 last:pb-0 hover:bg-canvas-soft/20 p-1 rounded-sm transition-colors">
                    <Avatar className="size-6 shrink-0 border border-hairline">
                      {pull.user?.avatar_url ? (
                        <AvatarImage src={pull.user.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                        {(pull.user?.login || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold text-ink leading-snug truncate" title={pull.title}>
                        {pull.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-mute">
                        <span className="font-mono text-primary font-semibold">#{pull.number}</span>
                        <span>by</span>
                        <span className="font-semibold text-ink-secondary">{pull.user?.login}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(pull.created_at), locale)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Issues & Releases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Issues Card */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col h-[350px]">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <AlertCircle className="size-4 text-emerald-500" />
                  {locale === "vi" ? "Issues Đang Mở" : "Active Issues"}
                </CardTitle>
                <CardDescription className="text-[10px] text-ink-mute mt-0.5">
                  {locale === "vi" ? "Các vấn đề đang mở trong dự án" : "Latest open issues for tracking"}
                </CardDescription>
              </div>
            </CardHeader>
            <Separator className="bg-hairline my-3" />
            <CardContent className="px-0 pb-0 overflow-y-auto flex-1 space-y-3 pr-1">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-mute">
                  {locale === "vi" ? "Không có issue nào đang mở." : "No open issues found."}
                </div>
              ) : (
                issues.map((issue: any) => (
                  <div key={issue.id} className="flex gap-3 text-xs border-b border-hairline pb-2.5 last:border-b-0 last:pb-0 hover:bg-canvas-soft/20 p-1 rounded-sm transition-colors">
                    <Avatar className="size-6 shrink-0 border border-hairline">
                      {issue.user?.avatar_url ? (
                        <AvatarImage src={issue.user.avatar_url} />
                      ) : null}
                      <AvatarFallback className="text-[9px] font-bold text-ink-secondary bg-canvas-soft">
                        {(issue.user?.login || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold text-ink leading-snug truncate" title={issue.title}>
                        {issue.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-mute font-mono">
                        <span className="text-emerald-500 font-semibold">#{issue.number}</span>
                        <span>•</span>
                        <span className="font-semibold text-ink-secondary">{issue.user?.login}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(issue.created_at), locale)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Releases Card */}
          <Card className="bg-canvas border border-hairline rounded-lg p-5 shadow-sm flex flex-col h-[350px]">
            <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <Tag className="size-4 text-primary" />
                  {locale === "vi" ? "Bản Phát Hành" : "Repository Releases"}
                </CardTitle>
                <CardDescription className="text-[10px] text-ink-mute mt-0.5">
                  {locale === "vi" ? "Các bản phát hành chính thức trên GitHub" : "Official repository releases"}
                </CardDescription>
              </div>
            </CardHeader>
            <Separator className="bg-hairline my-3" />
            <CardContent className="px-0 pb-0 overflow-y-auto flex-1 space-y-3 pr-1">
              {releases.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-mute">
                  {locale === "vi" ? "Chưa có bản phát hành nào." : "No releases published yet."}
                </div>
              ) : (
                releases.map((rel: any) => (
                  <div key={rel.id} className="flex gap-3 text-xs border-b border-hairline pb-2.5 last:border-b-0 last:pb-0 hover:bg-canvas-soft/20 p-1 rounded-sm transition-colors">
                    <div className="size-6 rounded-full border border-hairline bg-canvas-soft flex items-center justify-center text-primary font-bold text-[10px] shrink-0 font-mono">
                      v
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-semibold text-ink leading-snug truncate" title={rel.name || rel.tag_name}>
                        {rel.name || rel.tag_name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-ink-mute font-mono">
                        <span className="text-primary font-semibold">{rel.tag_name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(new Date(rel.published_at || rel.created_at), locale)}</span>
                        {rel.prerelease && (
                          <span className="px-1 py-0.2 text-[8px] uppercase tracking-wider font-bold rounded border border-amber-500/20 bg-amber-500/10 text-amber-600">Pre-release</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("Failed to load GitHub repository details via SSR:", error);
    return (
      <Card className="bg-canvas border border-destructive/20 rounded-lg p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-ink">GitHub Fetch Failed</h4>
            <p className="text-xs text-ink-mute mt-1 leading-relaxed">
              Unable to load repository data from GitHub. Please verify your integration token or check if the repository is private or deleted.
            </p>
            <p className="text-[10px] text-destructive/80 font-mono mt-2">{error?.message || "Unknown error"}</p>
          </div>
        </div>
      </Card>
    );
  }
}
