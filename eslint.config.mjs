import js from '@eslint/js'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettierConfig from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'

// react-hooks · typescript-eslint · import(eslint-plugin-import + TS resolver)는
// eslint-config-next가 이미 등록한다. 같은 키로 다시 등록하면 충돌하므로 규칙만 켠다
export default defineConfig([
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'unused-imports': unusedImports },
    rules: {
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
        },
      ],
      // barrel file 등으로 인한 순환 참조 방지
      'import/no-cycle': 'error',
      // 미사용 검사는 tsconfig(noUnusedLocals)가 아니라 ESLint로 한다.
      // Next가 생성하는 .next/dev/types/*.ts가 tsc 검사에 포함돼 noUnusedLocals에 걸리기 때문
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // 미사용 import는 eslint --fix로 자동 제거
      'unused-imports/no-unused-imports': 'error',
      // enum 대신 as const 사용
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'enum 대신 as const를 사용하세요.',
        },
      ],
    },
  },
  prettierConfig,
])
