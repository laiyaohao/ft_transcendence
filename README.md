*The project has been created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, ylai.*
# ft_transcendence

## Descriptions

Someone add description here please

## Instructions

### Prerequisites

- Docker Engine (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Make utility

### Installation and Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ft_transcendence
   ```
   

2. **Configure environment file:**
   The project uses environmental variables stored in the [`.env`](.env) file. Ensure the following variables are defined:
   - `POSTGRES_USER`
   - `POSTGRES_PW`
   - `POSTGRES_DB`

3. **Build and start the services:**
   ```bash
   make up
   ```