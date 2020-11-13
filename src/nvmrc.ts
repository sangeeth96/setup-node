import * as semver from 'semver';
import {getVersionsFromDist} from './node-versions';

export async function parseNvmrcString(contents: string): Promise<string> {
  contents = contents.trim();

  if (/^v\d/.test(contents)) {
    contents = contents.substring(1);
  }

  let resolvedVersion: string;

  if (contents === 'lts/*') {
    resolvedVersion = await findLatestLts();
  } else if (contents.startsWith('lts/')) {
    resolvedVersion = await findLatestLts(contents.replace('lts/', ''));
  } else if (semver.valid(contents) || isPartialMatch(contents)) {
    resolvedVersion = contents;
  } else {
    throw new Error("Couldn't parse provided .nvmrc value");
  }

  return resolvedVersion;
}

async function findLatestLts(codename?: string) {
  if (codename) {
    codename = codename[0].toUpperCase() + codename.substring(1);
  }

  const data = await getVersionsFromDist();

  if (codename) {
    const matchingItem = data.find(item => item.lts === codename);

    if (!matchingItem) {
      throw new Error(`no matching release found for codename ${codename}`);
    }

    return matchingItem.version.substring(1);
  }

  const latestItem = data
    .filter(item => item.lts)
    .reduce((latest, item) =>
      semver.gt(item.version, latest.version) ? item : latest
    );
  return latestItem.version.substring(1);
}

function isPartialMatch(version: string): boolean {
  return /^\d+(\.\d+(\.\d+)?)?$/.test(version);
}
