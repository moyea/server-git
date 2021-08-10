import { Injectable } from '@nestjs/common';
import path, { join } from 'path';
import * as fs from 'fs';
import gitP from 'simple-git/promise';
import { CheckRepoActions } from 'simple-git';

const git = gitP();

const basePath = join(__dirname, '..', 'data', 'pages');

@Injectable()
export class AppService {
  /**
   * 恢复文章历史版本
   * @param {string} title 文章标题
   * @param {string} hash 历史版本hash
   * @returns
   */
  async restore(title: string, hash: string) {
    // const indexedFile = this.getIndexFilePath(title);
    // if (!fs.existsSync(indexedFile)) {
    //   return null;
    // }
    console.log(title, hash);
    git.cwd(basePath);
    git.checkout(`${hash}:${title}.txt`);
    // git.revert(hash);
    git.add('.');
    git.addConfig('user.name', 'User');
    git.addConfig('user.email', 'example@example.com');
    const {
      latest: { message },
    } = await git.log(['--pretty=format:"%s"', hash, '-1']);
    await git.commit(`Revert: ${message}`);
    const { latest } = await git.log(['-1']);
    console.log(latest);
    const changeFile = this.getChangeFilePath(title);
    let changeHistory = [];
    if (fs.existsSync(changeFile)) {
      const changeBuf = fs.readFileSync(changeFile);
      changeHistory = JSON.parse(changeBuf.toString());
    }

    changeHistory.push(latest);
    await this.writeFile(changeFile, JSON.stringify(changeHistory));
    const indexedFile = this.getIndexFilePath(title);
    await this.writeFile(indexedFile, latest.hash);
    return 'success';
  }
  /**
   * 获取当前版本文章
   * @param {string} title 标题
   * @returns
   */
  async getArticle(title: string, version?: string) {
    if (version) {
      git.cwd(basePath);
      return await git.show(`${version}:${title}.txt`);
    }
    return fs.readFileSync(this.getFilePath(title));
  }
  getHistory(title: string) {
    const file = this.getChangeFilePath(title);
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file).toString());
    } else {
      return null;
    }
  }
  async saveArticle(article: {
    title: string;
    content: string;
    summary: string;
  }) {
    const file = this.getFilePath(article.title);
    git.cwd(basePath);
    const isRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
    if (!isRepo) {
      await git.init();
    }
    console.log('is-repo', isRepo);
    await this.writeFile(file, article.content);

    await git.add('.');
    git.addConfig('user.name', 'User');
    git.addConfig('user.email', 'example@example.com');
    await git.commit(article.summary);
    const { latest } = await git.log(['-1']);
    console.log(latest);
    const changeFile = this.getChangeFilePath(article.title);
    let changeHistory = [];
    if (fs.existsSync(changeFile)) {
      const changeBuf = fs.readFileSync(changeFile);
      changeHistory = JSON.parse(changeBuf.toString());
    }

    changeHistory.push(latest);
    await this.writeFile(changeFile, JSON.stringify(changeHistory));

    const indexedFile = this.getIndexFilePath(article.title);
    await this.writeFile(indexedFile, latest.hash);

    return 'success';
  }

  getArticleList() {
    let paths = fs.readdirSync(basePath);
    paths = paths
      .filter((path) => !/^\./.test(path))
      .map((path) => path.replace('.txt', ''));
    return paths;
  }

  private async writeFile(path: string, content: string) {
    const stream = fs.createWriteStream(path);
    stream.write(content, 'utf-8');
    stream.end();
    await new Promise<void>((resolve, reject) => {
      stream.on('close', resolve);
    });
  }

  private getFilePath(title: string) {
    return join(basePath, `${title}.txt`);
  }

  private getIndexFilePath(title: string) {
    return join(basePath, '..', 'meta', `${title}.indexed`);
  }

  private getChangeFilePath(title: string) {
    return join(basePath, '..', 'meta', `${title}.changes.json`);
  }
}
