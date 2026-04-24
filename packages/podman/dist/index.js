// @bun
// src/lib/arg-builder.ts
class ArgBuilder {
  args;
  constructor(command) {
    this.args = [command];
  }
  addValue(flag, value) {
    if (value === undefined)
      return;
    this.args.push(flag, String(value));
  }
  addBool(flag, value) {
    if (value === undefined)
      return;
    if (value) {
      this.args.push(flag);
      return;
    }
    this.args.push(`${flag}=false`);
  }
  addValues(flag, values) {
    if (!values)
      return;
    const list = Array.isArray(values) ? values : [values];
    if (!list.length)
      return;
    for (const value of list) {
      this.args.push(flag, value);
    }
  }
  add(arg) {
    this.args.push(arg);
  }
  toArgs() {
    return [...this.args];
  }
}

// src/commands/run.ts
import { spawn as spawn2 } from "child_process";

// src/lib/spawn.ts
import { promisify } from "util";
import { execFile, spawn } from "child_process";
import { createInterface } from "readline";
var execFileAsync = promisify(execFile);
async function execPodman(args) {
  const { stdout } = await execFileAsync("podman", args);
  return stdout;
}
async function execPodmanStreaming(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("podman", args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code && code !== 0) {
        reject(new Error(`podman ${args[0]} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}
async function execPodmanStreamingWithStdoutLines(args, onLine) {
  return new Promise((resolve, reject) => {
    const child = spawn("podman", args, { stdio: ["ignore", "pipe", "pipe"] });
    const stdout = child.stdout;
    const stderr = child.stderr;
    stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });
    stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
    const rl = createInterface({ input: stdout, crlfDelay: Infinity });
    rl.on("line", onLine);
    child.on("error", reject);
    child.on("close", (code) => {
      rl.close();
      if (code && code !== 0) {
        reject(new Error(`podman ${args[0]} exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}
function resolveProcessOutput(mode) {
  switch (mode) {
    case "pipe" /* Pipe */:
      return { stdio: "pipe", tee: false };
    case "ignore" /* Ignore */:
      return { stdio: "ignore", tee: false };
    case "tee" /* Tee */:
      return { stdio: "pipe", tee: true };
    case "inherit" /* Inherit */:
    default:
      return { stdio: "inherit", tee: false };
  }
}

// src/commands/run.ts
function run(options, processOptions = {}) {
  const args = new ArgBuilder("run");
  args.addValues("--add-host", options.addHost);
  args.addValues("--annotation", options.annotation);
  args.addValue("--arch", options.arch);
  args.addValues("--attach", options.attach);
  args.addValue("--authfile", options.authfile);
  args.addValue("--blkio-weight", options.blkioWeight);
  args.addValues("--blkio-weight-device", options.blkioWeightDevice);
  args.addValues("--cap-add", options.capAdd);
  args.addValues("--cap-drop", options.capDrop);
  args.addValues("--cgroup-conf", options.cgroupConf);
  args.addValue("--cgroup-parent", options.cgroupParent);
  args.addValue("--cgroupns", options.cgroupns);
  args.addValue("--cgroups", options.cgroups);
  args.addValues("--chrootdirs", options.chrootdirs);
  args.addValue("--cidfile", options.cidfile);
  args.addValue("--cpu-period", options.cpuPeriod);
  args.addValue("--cpu-quota", options.cpuQuota);
  args.addValue("--cpu-rt-period", options.cpuRtPeriod);
  args.addValue("--cpu-rt-runtime", options.cpuRtRuntime);
  args.addValue("--cpu-shares", options.cpuShares);
  args.addValue("--cpus", options.cpus);
  args.addValue("--cpuset-cpus", options.cpusetCpus);
  args.addValue("--cpuset-mems", options.cpusetMems);
  args.addBool("--detach", options.detach);
  args.addValue("--detach-keys", options.detachKeys);
  args.addValues("--device", options.device);
  args.addValues("--device-cgroup-rule", options.deviceCgroupRule);
  args.addValues("--device-read-bps", options.deviceReadBps);
  args.addValues("--device-read-iops", options.deviceReadIops);
  args.addValues("--device-write-bps", options.deviceWriteBps);
  args.addValues("--device-write-iops", options.deviceWriteIops);
  args.addBool("--disable-content-trust", options.disableContentTrust);
  args.addValues("--dns", options.dns);
  args.addValues("--dns-option", options.dnsOption);
  args.addValues("--dns-search", options.dnsSearch);
  args.addValue("--entrypoint", options.entrypoint);
  args.addValues("--env", options.env);
  args.addValues("--env-file", options.envFile);
  args.addValues("--env-merge", options.envMerge);
  args.addValues("--expose", options.expose);
  args.addValues("--gidmap", options.gidmap);
  args.addValues("--gpus", options.gpus);
  args.addValues("--group-add", options.groupAdd);
  args.addValue("--group-entry", options.groupEntry);
  args.addValue("--health-cmd", options.healthCmd);
  args.addValue("--health-interval", options.healthInterval);
  args.addValue("--health-log-destination", options.healthLogDestination);
  args.addValue("--health-max-log-count", options.healthMaxLogCount);
  args.addValue("--health-max-log-size", options.healthMaxLogSize);
  args.addValue("--health-on-failure", options.healthOnFailure);
  args.addValue("--health-retries", options.healthRetries);
  args.addValue("--health-start-period", options.healthStartPeriod);
  args.addValue("--health-startup-cmd", options.healthStartupCmd);
  args.addValue("--health-startup-interval", options.healthStartupInterval);
  args.addValue("--health-startup-retries", options.healthStartupRetries);
  args.addValue("--health-startup-success", options.healthStartupSuccess);
  args.addValue("--health-startup-timeout", options.healthStartupTimeout);
  args.addValue("--health-timeout", options.healthTimeout);
  args.addValue("--hostname", options.hostname);
  args.addValue("--hosts-file", options.hostsFile);
  args.addValues("--hostuser", options.hostuser);
  args.addBool("--http-proxy", options.httpProxy);
  args.addValue("--image-volume", options.imageVolume);
  args.addBool("--init", options.init);
  args.addValue("--init-path", options.initPath);
  args.addBool("--interactive", options.interactive);
  args.addValue("--ip", options.ip);
  args.addValue("--ip6", options.ip6);
  args.addValue("--ipc", options.ipc);
  args.addValues("--label", options.label);
  args.addValues("--label-file", options.labelFile);
  args.addValue("--log-driver", options.logDriver);
  args.addValues("--log-opt", options.logOpt);
  args.addValue("--mac-address", options.macAddress);
  args.addValue("--memory", options.memory);
  args.addValue("--memory-reservation", options.memoryReservation);
  args.addValue("--memory-swap", options.memorySwap);
  args.addValue("--memory-swappiness", options.memorySwappiness);
  args.addValues("--mount", options.mount);
  args.addValue("--name", options.name);
  args.addValues("--network", options.network);
  args.addValues("--network-alias", options.networkAlias);
  args.addBool("--no-healthcheck", options.noHealthcheck);
  args.addBool("--no-hostname", options.noHostname);
  args.addBool("--no-hosts", options.noHosts);
  args.addBool("--oom-kill-disable", options.oomKillDisable);
  args.addValue("--oom-score-adj", options.oomScoreAdj);
  args.addValue("--os", options.os);
  args.addBool("--passwd", options.passwd);
  args.addValue("--passwd-entry", options.passwdEntry);
  args.addValue("--personality", options.personality);
  args.addValue("--pid", options.pid);
  args.addValue("--pids-limit", options.pidsLimit);
  args.addValue("--platform", options.platform);
  args.addValue("--pod", options.pod);
  args.addValue("--pod-id-file", options.podIdFile);
  args.addBool("--privileged", options.privileged);
  args.addValues("--publish", options.publish);
  args.addBool("--publish-all", options.publishAll);
  args.addValue("--pull", options.pull);
  args.addBool("--quiet", options.quiet);
  args.addValue("--rdt-class", options.rdtClass);
  args.addBool("--read-only", options.readOnly);
  args.addBool("--read-only-tmpfs", options.readOnlyTmpfs);
  args.addBool("--replace", options.replace);
  args.addValues("--requires", options.requires);
  args.addValue("--restart", options.restart);
  args.addValue("--retry", options.retry);
  args.addValue("--retry-delay", options.retryDelay);
  args.addBool("--rm", options.rm);
  args.addBool("--rmi", options.rmi);
  args.addBool("--rootfs", options.rootfs);
  args.addValue("--sdnotify", options.sdnotify);
  args.addValue("--seccomp-policy", options.seccompPolicy);
  args.addValues("--secret", options.secret);
  args.addValues("--security-opt", options.securityOpt);
  args.addValue("--shm-size", options.shmSize);
  args.addValue("--shm-size-systemd", options.shmSizeSystemd);
  args.addBool("--sig-proxy", options.sigProxy);
  args.addValue("--stop-signal", options.stopSignal);
  args.addValue("--stop-timeout", options.stopTimeout);
  args.addValue("--subgidname", options.subgidname);
  args.addValue("--subuidname", options.subuidname);
  args.addValues("--sysctl", options.sysctl);
  args.addValue("--systemd", options.systemd);
  args.addValue("--timeout", options.timeout);
  args.addBool("--tls-verify", options.tlsVerify);
  args.addValue("--tmpfs", options.tmpfs);
  args.addBool("--tty", options.tty);
  args.addValue("--tz", options.tz);
  args.addValues("--uidmap", options.uidmap);
  args.addValues("--ulimit", options.ulimit);
  args.addValue("--umask", options.umask);
  args.addValues("--unsetenv", options.unsetenv);
  args.addBool("--unsetenv-all", options.unsetenvAll);
  args.addValue("--user", options.user);
  args.addValue("--userns", options.userns);
  args.addValue("--uts", options.uts);
  args.addValue("--variant", options.variant);
  args.addValues("--volume", options.volume);
  args.addValues("--volumes-from", options.volumesFrom);
  args.addValue("--workdir", options.workdir);
  args.add(options.image);
  if (options.command) {
    const commandParts = Array.isArray(options.command) ? options.command : [options.command];
    for (const part of commandParts) {
      args.add(part);
    }
  }
  if (options.commandArgs?.length) {
    for (const part of options.commandArgs) {
      args.add(part);
    }
  }
  const stdoutConfig = resolveProcessOutput(processOptions.stdout);
  const stderrConfig = resolveProcessOutput(processOptions.stderr);
  const child = spawn2("podman", args.toArgs(), {
    stdio: ["inherit", stdoutConfig.stdio, stderrConfig.stdio]
  });
  const stdout = child.stdout ?? null;
  const stderr = child.stderr ?? null;
  if (stdout && stdoutConfig.tee) {
    stdout.on("data", (chunk) => {
      process.stdout.write(chunk);
    });
  }
  if (stderr && stderrConfig.tee) {
    stderr.on("data", (chunk) => {
      process.stderr.write(chunk);
    });
  }
  const exitPromise = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
  return {
    kill: () => child.kill("SIGKILL"),
    term: () => child.kill("SIGTERM"),
    wait: () => exitPromise,
    waitThrow: async () => {
      const code = await exitPromise;
      if (code !== 0) {
        throw new Error(`podman run exited with code ${code}`);
      }
      return code;
    },
    stdout,
    stderr
  };
}
// src/commands/build.ts
async function build(options = {}) {
  const args = new ArgBuilder("build");
  args.addValues("--add-host", options.addHost);
  args.addBool("--all-platforms", options.allPlatforms);
  args.addValues("--annotation", options.annotation);
  args.addValue("--arch", options.arch);
  args.addValue("--authfile", options.authfile);
  args.addValues("--build-arg", options.buildArg);
  args.addValue("--build-arg-file", options.buildArgFile);
  args.addValues("--build-context", options.buildContext);
  args.addValues("--cache-from", options.cacheFrom);
  args.addValues("--cache-to", options.cacheTo);
  args.addValue("--cache-ttl", options.cacheTtl);
  args.addValues("--cap-add", options.capAdd);
  args.addValues("--cap-drop", options.capDrop);
  args.addValue("--cert-dir", options.certDir);
  args.addValue("--cgroup-parent", options.cgroupParent);
  args.addValue("--cgroupns", options.cgroupns);
  args.addBool("--compat-volumes", options.compatVolumes);
  args.addValues("--cpp-flag", options.cppFlag);
  args.addValue("--cpu-period", options.cpuPeriod);
  args.addValue("--cpu-quota", options.cpuQuota);
  args.addValue("--cpu-shares", options.cpuShares);
  args.addValue("--cpuset-cpus", options.cpusetCpus);
  args.addValue("--cpuset-mems", options.cpusetMems);
  args.addBool("--created-annotation", options.createdAnnotation);
  args.addValue("--creds", options.creds);
  args.addValues("--decryption-key", options.decryptionKey);
  args.addValues("--device", options.device);
  args.addBool("--disable-compression", options.disableCompression);
  args.addValue("--dns", options.dns);
  args.addValues("--dns-option", options.dnsOption);
  args.addValues("--dns-search", options.dnsSearch);
  args.addValues("--env", options.env);
  args.addValue("--file", options.file);
  args.addBool("--force-rm", options.forceRm);
  args.addValue("--format", options.format);
  args.addValue("--from", options.from);
  args.addValues("--group-add", options.groupAdd);
  args.addValues("--hooks-dir", options.hooksDir);
  args.addBool("--http-proxy", options.httpProxy);
  args.addBool("--identity-label", options.identityLabel);
  args.addValue("--ignorefile", options.ignorefile);
  args.addValue("--iidfile", options.iidfile);
  args.addBool("--inherit-annotations", options.inheritAnnotations);
  args.addBool("--inherit-labels", options.inheritLabels);
  args.addValue("--ipc", options.ipc);
  args.addValue("--isolation", options.isolation);
  args.addValue("--jobs", options.jobs);
  args.addValues("--label", options.label);
  args.addValues("--layer-label", options.layerLabel);
  args.addBool("--layers", options.layers);
  args.addValue("--logfile", options.logfile);
  args.addValue("--manifest", options.manifest);
  args.addValue("--memory", options.memory);
  args.addValue("--memory-swap", options.memorySwap);
  args.addValue("--network", options.network);
  args.addBool("--no-cache", options.noCache);
  args.addBool("--no-hostname", options.noHostname);
  args.addBool("--no-hosts", options.noHosts);
  args.addBool("--omit-history", options.omitHistory);
  args.addValue("--os", options.os);
  args.addValue("--os-feature", options.osFeature);
  args.addValue("--os-version", options.osVersion);
  args.addValue("--pid", options.pid);
  args.addValue("--platform", options.platform);
  args.addValue("--pull", options.pull);
  args.addBool("--quiet", options.quiet);
  args.addValue("--retry", options.retry);
  args.addValue("--retry-delay", options.retryDelay);
  args.addBool("--rewrite-timestamp", options.rewriteTimestamp);
  args.addBool("--rm", options.rm);
  args.addValues("--runtime-flag", options.runtimeFlag);
  args.addValue("--sbom", options.sbom);
  args.addValue("--sbom-image-output", options.sbomImageOutput);
  args.addValue("--sbom-image-purl-output", options.sbomImagePurlOutput);
  args.addValue("--sbom-merge-strategy", options.sbomMergeStrategy);
  args.addValue("--sbom-output", options.sbomOutput);
  args.addValue("--sbom-purl-output", options.sbomPurlOutput);
  args.addValue("--sbom-scanner-command", options.sbomScannerCommand);
  args.addValue("--sbom-scanner-image", options.sbomScannerImage);
  args.addValues("--secret", options.secret);
  args.addValues("--security-opt", options.securityOpt);
  args.addValue("--shm-size", options.shmSize);
  args.addBool("--skip-unused-stages", options.skipUnusedStages);
  args.addValue("--source-date-epoch", options.sourceDateEpoch);
  args.addBool("--squash", options.squash);
  args.addBool("--squash-all", options.squashAll);
  args.addValues("--ssh", options.ssh);
  args.addBool("--stdin", options.stdin);
  args.addValues("--tag", options.tag);
  args.addValue("--target", options.target);
  args.addValue("--timestamp", options.timestamp);
  args.addValues("--ulimit", options.ulimit);
  args.addValues("--unsetannotation", options.unsetannotation);
  args.addValues("--unsetenv", options.unsetenv);
  args.addValues("--unsetlabel", options.unsetlabel);
  args.addValue("--userns", options.userns);
  args.addValue("--userns-gid-map", options.usernsGidMap);
  args.addValue("--userns-gid-map-group", options.usernsGidMapGroup);
  args.addValue("--userns-uid-map", options.usernsUidMap);
  args.addValue("--userns-uid-map-user", options.usernsUidMapUser);
  args.addValue("--uts", options.uts);
  args.addValue("--variant", options.variant);
  args.addValues("--volume", options.volume);
  args.add(options.context ?? ".");
  let imageId;
  await execPodmanStreamingWithStdoutLines(args.toArgs(), (line) => {
    const trimmed = line.trim();
    if (/^[a-f0-9]{64}$/.test(trimmed)) {
      imageId = trimmed;
    }
  });
  if (!imageId) {
    throw new Error("Unable to determine built image ID from podman output.");
  }
  return imageId;
}
// src/commands/push.ts
async function push(options) {
  const args = new ArgBuilder("push");
  args.addValue("--authfile", options.authfile);
  args.addValue("--compression-format", options.compressionFormat);
  args.addValue("--compression-level", options.compressionLevel);
  args.addValue("--creds", options.creds);
  args.addValue("--digestfile", options.digestfile);
  args.addBool("--disable-content-trust", options.disableContentTrust);
  args.addBool("--force-compression", options.forceCompression);
  args.addValue("--format", options.format);
  args.addBool("--remove-signatures", options.removeSignatures);
  args.addValue("--retry", options.retry);
  args.addValue("--retry-delay", options.retryDelay);
  args.addBool("--tls-verify", options.tlsVerify);
  args.add(options.image);
  if (options.destination) {
    args.add(options.destination);
  }
  return execPodmanStreaming(args.toArgs());
}
// src/commands/tag.ts
async function tag(image, targetNames) {
  const args = new ArgBuilder("tag");
  const targets = Array.isArray(targetNames) ? targetNames : [targetNames];
  if (targets.length === 0) {
    throw new Error("podman tag requires at least one target name.");
  }
  args.add(image);
  for (const target of targets) {
    args.add(target);
  }
  return execPodmanStreaming(args.toArgs());
}
// src/commands/start-machine.ts
async function listMachines() {
  const out = await execPodman(["machine", "list", "--format", "json"]);
  return JSON.parse(out || "[]");
}
async function isMachineRunning(machineName = "podman-machine-default") {
  const machines = await listMachines();
  const m = machines.find((x) => x.Name === machineName);
  if (!m) {
    throw new Error(`Podman machine "${machineName}" not found in list:
${machines.map((x) => `- ${x.Name}`).join(`
`)}`);
  }
  return m.Running;
}
async function startMachine(machineName = "podman-machine-default") {
  await execPodman(["machine", "start", machineName]);
}
async function forceStartMachine(machineName = "podman-machine-default") {
  try {
    await startMachine(machineName);
    return true;
  } catch (err) {
    if (isAlreadyRunningError(err)) {
      return false;
    }
    throw err;
  }
}
function isAlreadyRunningError(err) {
  if (!err || typeof err !== "object") {
    return false;
  }
  const candidate = err;
  const combined = [candidate.stderr, candidate.stdout, candidate.message].filter(Boolean).join(`
`);
  return combined.toLowerCase().includes("already running");
}
export {
  tag,
  startMachine,
  run,
  push,
  listMachines,
  isMachineRunning,
  forceStartMachine,
  build
};
