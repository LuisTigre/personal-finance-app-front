# Keycloak Custom Theme - Personal Finance App

This directory contains a custom Keycloak theme that matches the look and feel of the Personal Finance App (using CoreUI design system).

## Theme Overview

The **persfin-theme** provides custom styling for Keycloak's authentication pages:
- **Login page**: Purple gradient background, white card, CoreUI-styled inputs
- **Registration page**: Matching design with first/last name, email, username, password fields  
- **Password reset page**: Consistent styling for password recovery flow

## Theme Structure

```
persfin-theme/
└── login/
    ├── theme.properties           # Theme configuration
    ├── login.ftl                  # Login page template
    ├── register.ftl               # Registration page template
    ├── login-reset-password.ftl   # Password reset template
    └── resources/
        └── css/
            └── styles.css         # Custom CSS matching CoreUI design
```

## Installation & Deployment

### Step 1: Choose Deployment Method

#### Option A: Docker (Recommended for Development)

Add volume mount to your `docker-compose.yml`:

```yaml
version: '3'
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.0.0
    environment:
      - KEYCLOAK_ADMIN=admin
      - KEYCLOAK_ADMIN_PASSWORD=admin
    ports:
      - "8080:8080"
    volumes:
      - ./keycloak-themes/persfin-theme:/opt/keycloak/themes/persfin-theme
    command: start-dev
```

Restart container:
```bash
docker-compose restart keycloak
```

#### Option B: Local Keycloak Installation

Copy theme to Keycloak themes directory:

**Windows:**
```cmd
xcopy /E /I keycloak-themes\persfin-theme C:\path\to\keycloak\themes\persfin-theme
```

**Linux/Mac:**
```bash
cp -r keycloak-themes/persfin-theme /path/to/keycloak/themes/
```

Restart Keycloak:
```bash
# Linux/Mac
/path/to/keycloak/bin/kc.sh start-dev

# Windows
C:\path\to\keycloak\bin\kc.bat start-dev
```

### Step 2: Activate Theme in Keycloak

1. Open Keycloak Admin Console: http://localhost:8080
2. Log in with admin credentials
3. Select realm: **Persfin**
4. Navigate to: **Realm Settings** → **Themes** tab
5. Select **persfin-theme** from "Login theme" dropdown
6. Click **Save**

### Step 3: Verify Theme

1. Log out of Keycloak Admin Console
2. Open your Angular app: http://localhost:4200
3. Should immediately redirect to Keycloak login with:
   - Purple gradient background
   - White card with rounded corners
   - CoreUI-styled input fields and buttons
   - "Forgot Password" link
   - "Register" option

## Theme Details

### Files Overview

- **theme.properties**: Extends `keycloak` theme, imports CSS
- **styles.css**: Complete CoreUI-matched styling (colors, gradients, forms, buttons)
- **login.ftl**: Login form with username/password, Remember Me checkbox
- **register.ftl**: Registration form with full name, email, username, password fields
- **login-reset-password.ftl**: Password reset form

### Design Features

- **Background**: Purple gradient (`#667eea` to `#764ba2`)
- **Primary Button**: CoreUI blue (`#321fdb`)
- **Form Inputs**: Rounded borders, focus states with shadow
- **Card Design**: White background, shadow, rounded corners
- **Typography**: System fonts stack (Segoe UI, Roboto, etc.)
- **Responsive**: Mobile-optimized with media queries

## Customization

### Change Colors

Edit [resources/css/styles.css](persfin-theme/login/resources/css/styles.css):

```css
/* Primary button color */
.btn { background-color: #321fdb; }

/* Background gradient */
body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

/* Input focus color */
.form-control:focus { border-color: #768fff; }
```

### Add Logo

1. Place logo image in `persfin-theme/login/resources/img/logo.png`
2. Edit FTL templates ([login.ftl](persfin-theme/login/login.ftl), [register.ftl](persfin-theme/login/register.ftl), etc.)
3. Add in `<#if section = "header">` block:

```ftl
<#if section = "header">
    <div style="text-align: center; margin-bottom: 1rem;">
        <img src="${url.resourcesPath}/img/logo.png" alt="App Logo" style="max-width: 120px;">
    </div>
    Personal Finance App
</#if>
```

### Custom Fonts

1. Add font files to `resources/fonts/`
2. Add `@font-face` in `styles.css`:

```css
@font-face {
  font-family: 'CustomFont';
  src: url('../fonts/CustomFont.woff2') format('woff2');
}

body { font-family: 'CustomFont', sans-serif; }
```

## Troubleshooting

### Theme Not Appearing

- **Check Keycloak logs**: Look for theme loading errors
  ```bash
  docker logs <keycloak-container>
  ```
- **Verify file structure**: Must match exactly as shown above
- **Check file permissions**: Keycloak needs read access
- **Clear browser cache**: Hard refresh with Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Restart Keycloak**: Required after copying new theme files

### Styles Not Loading

- Verify `theme.properties` contains: `styles=css/styles.css`
- Check browser console (F12) for 404 errors on CSS
- Ensure CSS file is at: `persfin-theme/login/resources/css/styles.css`
- Verify CSS file encoding is UTF-8

### Template Errors (500 Server Error)

- Check Keycloak server logs for FreeMarker errors
- Validate FTL syntax (no unclosed tags, proper `<#...>` directives)
- Ensure all FTL files import template: `<#import "template.ftl" as layout>`
- Check UTF-8 encoding on all FTL files

### App Not Redirecting to Keycloak

- Verify [app.config.ts](../src/app/app.config.ts) has `onLoad: 'login-required'`
- Check browser console for Keycloak initialization errors
- Ensure Keycloak client configuration:
  - Client ID: `persfin-frontend`
  - Access Type: **public**
  - Standard Flow Enabled: **ON**
  - Valid Redirect URIs: `http://localhost:4200/*`
  - Web Origins: `http://localhost:4200`

## Development Workflow

When iterating on theme:

1. Edit theme files in `keycloak-themes/persfin-theme/`
2. Copy to Keycloak themes directory (or restart Docker if using volume)
3. Clear browser cache: Ctrl+Shift+Delete
4. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
5. Test all flows: login, register, forgot password

**Tip**: Disable theme cache for faster development:
- In `docker-compose.yml`, add to Keycloak environment:
  ```yaml
  - KC_SPI_THEME_CACHE_THEMES=false
  - KC_SPI_THEME_CACHE_TEMPLATES=false
  ```

## Production Deployment

### Build Custom Keycloak Image

Create `Dockerfile`:

```dockerfile
FROM quay.io/keycloak/keycloak:26.0.0

# Copy custom theme
COPY keycloak-themes/persfin-theme /opt/keycloak/themes/persfin-theme

# Build optimized image
RUN /opt/keycloak/bin/kc.sh build

# Set default theme via environment
ENV KC_SPI_THEME_DEFAULT=persfin-theme

# Production start command
ENTRYPOINT ["/opt/keycloak/bin/kc.sh", "start"]
```

Build and push:
```bash
docker build -t myregistry/keycloak-persfin:latest .
docker push myregistry/keycloak-persfin:latest
```

### Realm Configuration

Export realm configuration with theme setting:

```json
{
  "realm": "Persfin",
  "loginTheme": "persfin-theme",
  ...
}
```

Import on deployment:
```bash
/opt/keycloak/bin/kc.sh import --file persfin-realm.json
```

### Version Control

- Commit all theme files to repository
- Tag releases with theme version
- Document customizations in this README
- Include theme files in CI/CD pipeline

## Additional Resources

- [Keycloak Server Administration](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak Theme Development](https://www.keycloak.org/docs/latest/server_development/#_themes)
- [CoreUI Design System](https://coreui.io/)
- Use absolute paths in FTL templates
