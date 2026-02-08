@echo off
echo Configuring git user... > commit.log
git config user.email "bot@example.com" >> commit.log 2>&1
git config user.name "Bot" >> commit.log 2>&1
echo Adding files... >> commit.log
git add . >> commit.log 2>&1
echo Committing... >> commit.log
git commit -m "feat: rebrand to YouTube Downloader, add ads, and prepare for deployment" >> commit.log 2>&1
echo Done. >> commit.log
