import { KeycloakConfig } from 'keycloak-js';

/**
 * Keycloak Configuration for Persfin Realm
 * 
 * This configuration uses Authorization Code Flow with PKCE for secure authentication.
 * Client is configured as a public client (no client secret).
 * 
 * Configuration in Keycloak:
 * - Realm: Persfin
 * - Client ID: persfin-frontend
 * - Client Type: Public
 * - Valid Redirect URIs: http://localhost:4200/*
 * - Valid Post Logout Redirect URIs: http://localhost:4200/*
 * - PKCE: S256 enabled
 */
export const keycloakConfig: KeycloakConfig = {
  url: 'http://localhost:8080',
  realm: 'Persfin',
  clientId: 'persfin-frontend'
};
