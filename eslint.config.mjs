// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Configuración base de ESLint
  eslint.configs.recommended,
  
  // Configuración recomendada para TypeScript
  ...tseslint.configs.recommended,
  
  // Desactiva reglas de ESLint que conflictan con Prettier
  eslintConfigPrettier,
  
  {
    // Archivos a los que aplican las reglas
    files: ['**/*.ts', '**/*.tsx'],
    
    plugins: {
      prettier,
    },
    
    rules: {
      // Prettier como regla de ESLint (muestra errores de formato)
      'prettier/prettier': 'warn',
      
      // Reglas útiles para FP
      'no-var': 'error',                           // Fuerza let/const
      'prefer-const': 'warn',                      // Prefiere const sobre let
      '@typescript-eslint/no-unused-vars': 'warn', // Variables no usadas
      
      // Más permisivo para aprendizaje
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  
  {
    // Ignorar archivos
    ignores: ['node_modules/**', 'dist/**', '*.js'],
  }
);
