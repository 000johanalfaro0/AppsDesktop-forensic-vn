#!/usr/bin/env python3
"""Generate synthetic, inert evidence for Caso #2 (The Logic Bomb — inspired by the real
Roger Duronio / UBS PaineWebber case, 2002). Solvable with: find, grep, stat, cat, xargs."""
import os
import time

ROOT = os.path.join(os.path.dirname(__file__), "..", "evidence", "caso02")
os.makedirs(ROOT, exist_ok=True)


def write(name, data, mtime=None):
    p = os.path.join(ROOT, name)
    with open(p, "wb") as f:
        f.write(data)
    if mtime:
        # set access and modification times (atime, mtime)
        os.utime(p, (mtime, mtime))
    return p


# --- Step 1 & 2 evidence: cron configurations & the malicious script
# Roger Duronio created a logic bomb script and scheduled it via cron.
cron_config = (
    "# /etc/cron.d/sync_service - hourly synchronization verification\n"
    "# Maintained by Systems Administration\n"
    "00 * * * * root /usr/local/bin/backup_verify.sh > /dev/null 2>&1\n"
)
write("cron_config.txt", cron_config.encode())

# The logic bomb script containing the Unix trigger timestamp (1014962400 = March 4, 2002 12:00:00 UTC)
backup_script = (
    "#!/bin/bash\n"
    "# UBS PaineWebber Backup Verification Utility\n"
    "# WARNING: DO NOT MODIFY. AUTOMATICALLY UPDATED BY SYSTEM.\n\n"
    "BACKUP_DIR=\"/var/backups\"\n"
    "STATUS_LOG=\"/var/log/backup_verify.log\"\n"
    "TRIGGER_TIME=1014962400\n\n"
    "CURRENT_TIME=$(date +%s)\n\n"
    "if [ \"$CURRENT_TIME\" -ge \"$TRIGGER_TIME\" ]; then\n"
    "    echo \"[$(date)] Backup integrity critical failure. Initiating recovery wipe...\" >> $STATUS_LOG\n"
    "    # rm -rf /var/backups/* (simulated deletion)\n"
    "    exit 1\n"
    "fi\n\n"
    "echo \"[$(date)] Backup verification complete. Integrity check: OK.\" >> $STATUS_LOG\n"
    "exit 0\n"
)
# Set its mtime to February 15, 2002 09:30:00 UTC (1013765400)
write("backup_verify.sh", backup_script.encode(), mtime=1013765400)


# --- Step 3 evidence: a log file mapping user actions (system.log)
# Tucked in the syslog is the sudo VI edit command to prove WHO created the cron file.
syslog_data = (
    "Feb 15 09:00:12 prod-web-01 sshd[1245]: Server listening on 0.0.0.0 port 22.\n"
    "Feb 15 09:15:32 prod-web-01 sshd[1410]: Accepted publickey for rduronio from 192.168.1.45 port 54322 ssh2\n"
    "Feb 15 09:15:35 prod-web-01 systemd[1]: Started User Manager for UID 1004.\n"
    "Feb 15 09:16:10 prod-web-01 sudo[1422]: rduronio : TTY=pts/0 ; PWD=/home/rduronio ; USER=root ; COMMAND=/usr/bin/vi /etc/cron.d/sync_service\n"
    "Feb 15 09:18:22 prod-web-01 sudo[1430]: rduronio : TTY=pts/0 ; PWD=/home/rduronio ; USER=root ; COMMAND=/usr/bin/cp /tmp/backup_verify.sh /usr/local/bin/backup_verify.sh\n"
    "Feb 15 09:19:05 prod-web-01 sudo[1435]: rduronio : TTY=pts/0 ; PWD=/home/rduronio ; USER=root ; COMMAND=/usr/bin/chmod +x /usr/local/bin/backup_verify.sh\n"
    "Feb 15 09:30:00 prod-web-01 CRON[1450]: (root) CMD (/usr/local/bin/backup_verify.sh > /dev/null 2>&1)\n"
    "Feb 15 10:00:00 prod-web-01 CRON[1510]: (root) CMD (/usr/local/bin/backup_verify.sh > /dev/null 2>&1)\n"
)
# pad with generic lines to make grep necessary
padded_syslog = []
for i in range(120):
    timestamp = f"Feb 15 {9 + i//60:02d}:{i%60:02d}:15"
    if i == 15:
        padded_syslog.append("Feb 15 09:15:32 prod-web-01 sshd[1410]: Accepted publickey for rduronio from 192.168.1.45 port 54322 ssh2")
    elif i == 18:
        padded_syslog.append("Feb 15 09:18:22 prod-web-01 sudo[1430]: rduronio : TTY=pts/0 ; PWD=/home/rduronio ; USER=root ; COMMAND=/usr/bin/cp /tmp/backup_verify.sh /usr/local/bin/backup_verify.sh")
    elif i == 16:
        padded_syslog.append("Feb 15 09:16:10 prod-web-01 sudo[1422]: rduronio : TTY=pts/0 ; PWD=/home/rduronio ; USER=root ; COMMAND=/usr/bin/vi /etc/cron.d/sync_service")
    else:
        padded_syslog.append(f"{timestamp} prod-web-01 CRON[{2000+i}]: (root) CMD (system_cleanup.sh > /dev/null 2>&1)")

write("system.log", "\n".join(padded_syslog).encode())


# --- Case brief
brief = (
    "CASE 02 - THE LOGIC BOMB\n"
    "A major financial institution had its backup systems wiped. Investigation shows\n"
    "a logic bomb was planted in the crontab. Analyze the logs and configs in this directory.\n"
    "Identify the script name, the trigger timestamp, the user who edited it, and the file modification date.\n"
    "Tools you know: find, grep, stat, cat, xargs. Do NOT modify originals.\n"
)
write("BRIEF.txt", brief.encode())

print("Generated in", os.path.realpath(ROOT))
for fn in sorted(os.listdir(ROOT)):
    p = os.path.join(ROOT, fn)
    print(f" - {fn} {os.path.getsize(p)} bytes (mtime: {time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime(os.path.getmtime(p)))})")
