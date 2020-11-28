# Notion backup

I do not believe to clouds and prefer have local copy of all my data. But Notion is very useful tool with no open source alternatives. This script can backup all data using standard export feature in Notion.

This thing require NodeJS to run.

```bash
npm i
mkdir -p data
EMAIL=mail@exmaple.com PASSWORD=kek EXPORT_TYPE=both node notion
```

You can also use Docker image with this scrip and cron

```bash
docker run -e EMAIL=mail@exmaple.com -e PASSWORD=kek  ivanik/notion-backup
```

Docker compose file example

```yaml
version: "3"
services:
  notion-backup:
    image: ivanik/notion-backup
    environment:
      EMAIL: notion-email@exmaple.com
      PASSWORD: n0t1onPa$$w0rd
      EXPORT_TYPE: both # markdown/html/both
      DELETE_OLD: 15 # delete backup after 15 days
    volumes:
      - ./data:/app/data # backup dir
      - ./crontab:/app/crontab # change cron settings (optional)
```

## Environment Variables

- `Email` - Notion email
- `password` - Notion password
- `EXPORT_TYPE` - export format markdown/html/pdf/both (`pdf` is only available with a personal plus plan or higher. `both` - backup in markdown and html)
- `DELETE_OLD` - after how many days delete backups
