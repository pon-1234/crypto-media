#!/usr/bin/env node

/**
 * CI環境用のカバレッジマージスクリプト
 * jsdomとnodeのカバレッジ結果を統合する
 */

const fs = require('fs');
const path = require('path');

const coverageDir = path.join(__dirname, '..', 'coverage');
const jsdomCoverageFile = path.join(coverageDir, 'jsdom', 'coverage-summary.json');
const nodeCoverageFile = path.join(coverageDir, 'node', 'coverage-summary.json');
const mergedCoverageFile = path.join(coverageDir, 'coverage-summary.json');

// カバレッジディレクトリが存在しない場合は作成
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

/**
 * カバレッジメトリクスをマージする
 * @param {Object} metric1 - 最初のメトリクス
 * @param {Object} metric2 - 2番目のメトリクス
 * @returns {Object} マージされたメトリクス
 */
function mergeCoverageMetrics(metric1, metric2) {
  const total = metric1.total + metric2.total;
  const covered = metric1.covered + metric2.covered;
  const skipped = metric1.skipped + metric2.skipped;
  const pct = total > 0 ? (covered / total) * 100 : 0;
  
  return {
    total,
    covered,
    skipped,
    pct: Math.round(pct * 100) / 100 // 小数点第2位まで
  };
}

/**
 * カバレッジデータをマージする
 * @param {Object} coverage1 - 最初のカバレッジデータ
 * @param {Object} coverage2 - 2番目のカバレッジデータ
 * @returns {Object} マージされたカバレッジデータ
 */
function mergeCoverageData(coverage1, coverage2) {
  return {
    total: {
      lines: mergeCoverageMetrics(coverage1.total.lines, coverage2.total.lines),
      statements: mergeCoverageMetrics(coverage1.total.statements, coverage2.total.statements),
      functions: mergeCoverageMetrics(coverage1.total.functions, coverage2.total.functions),
      branches: mergeCoverageMetrics(coverage1.total.branches, coverage2.total.branches),
    }
  };
}

// カバレッジファイルをマージ
if (fs.existsSync(jsdomCoverageFile) && fs.existsSync(nodeCoverageFile)) {
  console.log('Merging jsdom and node coverage reports...');
  
  const jsdomCoverage = JSON.parse(fs.readFileSync(jsdomCoverageFile, 'utf8'));
  const nodeCoverage = JSON.parse(fs.readFileSync(nodeCoverageFile, 'utf8'));
  
  console.log('\nJSDOM coverage:');
  console.log(`- Statements: ${jsdomCoverage.total.statements.covered}/${jsdomCoverage.total.statements.total} (${jsdomCoverage.total.statements.pct}%)`);
  console.log(`- Branches: ${jsdomCoverage.total.branches.covered}/${jsdomCoverage.total.branches.total} (${jsdomCoverage.total.branches.pct}%)`);
  console.log(`- Functions: ${jsdomCoverage.total.functions.covered}/${jsdomCoverage.total.functions.total} (${jsdomCoverage.total.functions.pct}%)`);
  console.log(`- Lines: ${jsdomCoverage.total.lines.covered}/${jsdomCoverage.total.lines.total} (${jsdomCoverage.total.lines.pct}%)`);
  
  console.log('\nNode.js coverage:');
  console.log(`- Statements: ${nodeCoverage.total.statements.covered}/${nodeCoverage.total.statements.total} (${nodeCoverage.total.statements.pct}%)`);
  console.log(`- Branches: ${nodeCoverage.total.branches.covered}/${nodeCoverage.total.branches.total} (${nodeCoverage.total.branches.pct}%)`);
  console.log(`- Functions: ${nodeCoverage.total.functions.covered}/${nodeCoverage.total.functions.total} (${nodeCoverage.total.functions.pct}%)`);
  console.log(`- Lines: ${nodeCoverage.total.lines.covered}/${nodeCoverage.total.lines.total} (${nodeCoverage.total.lines.pct}%)`);
  
  // カバレッジをマージ
  const mergedCoverage = mergeCoverageData(jsdomCoverage, nodeCoverage);
  
  console.log('\nMerged coverage:');
  console.log(`- Statements: ${mergedCoverage.total.statements.covered}/${mergedCoverage.total.statements.total} (${mergedCoverage.total.statements.pct}%)`);
  console.log(`- Branches: ${mergedCoverage.total.branches.covered}/${mergedCoverage.total.branches.total} (${mergedCoverage.total.branches.pct}%)`);
  console.log(`- Functions: ${mergedCoverage.total.functions.covered}/${mergedCoverage.total.functions.total} (${mergedCoverage.total.functions.pct}%)`);
  console.log(`- Lines: ${mergedCoverage.total.lines.covered}/${mergedCoverage.total.lines.total} (${mergedCoverage.total.lines.pct}%)`);
  
  // マージしたカバレッジを保存
  fs.writeFileSync(mergedCoverageFile, JSON.stringify(mergedCoverage, null, 2));
  console.log('\nMerged coverage written to:', mergedCoverageFile);
} else if (fs.existsSync(jsdomCoverageFile)) {
  // jsdomのカバレッジのみ存在する場合
  console.log('Only jsdom coverage found, using it as the final coverage');
  const jsdomCoverage = JSON.parse(fs.readFileSync(jsdomCoverageFile, 'utf8'));
  fs.writeFileSync(mergedCoverageFile, JSON.stringify(jsdomCoverage, null, 2));
} else if (fs.existsSync(nodeCoverageFile)) {
  // nodeのカバレッジのみ存在する場合
  console.log('Only node coverage found, using it as the final coverage');
  const nodeCoverage = JSON.parse(fs.readFileSync(nodeCoverageFile, 'utf8'));
  fs.writeFileSync(mergedCoverageFile, JSON.stringify(nodeCoverage, null, 2));
} else {
  console.error('No coverage files found!');
  process.exit(1);
}

// coverage-final.jsonも同様に処理（詳細レポート用）
const jsdomFinalFile = path.join(coverageDir, 'jsdom', 'coverage-final.json');
const mergedFinalFile = path.join(coverageDir, 'coverage-final.json');

if (fs.existsSync(jsdomFinalFile)) {
  fs.copyFileSync(jsdomFinalFile, mergedFinalFile);
  console.log('Coverage final report copied');
}