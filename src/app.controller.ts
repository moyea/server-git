import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Render,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root() {
    const list = this.appService.getArticleList();
    return {
      articleList: list,
      message: ' Hello world!',
    };
  }

  @Post('article')
  saveArticle(
    @Body() article: { title: string; content: string; summary: string },
  ) {
    console.log(article);
    return this.appService.saveArticle(article);
  }

  @Get('/history')
  getHistory(@Query() title: string) {
    return this.appService.getHistory(title);
  }

  @Get('/article')
  getArticle(@Query() title: string) {
    return this.appService.getArticle(title);
  }

  @Get('/page/restore')
  restore(@Query('title') title: string, @Query('hash') hash: string) {
    return this.appService.restore(title, hash);
  }

  @Get('/page/:title')
  @Render('article-detail.hbs')
  detailPage(@Param('title') title: string) {
    const content = this.appService.getArticle(title);
    return {
      title,
      content,
    };
  }

  @Get('/page/:title/history')
  @Render('change-history.hbs')
  changeHistory(@Param('title') title: string) {
    let history = this.appService.getHistory(title);
    history = history
      .map((item, index) => ({ ...item, index: index + 1 }))
      .reverse();
    return {
      title,
      history,
    };
  }

  @Get('/page/:title/:version')
  @Render('article-detail.hbs')
  async versionHistory(
    @Param('title') title: string,
    @Param('version') version: string,
  ) {
    let content = await this.appService.getArticle(title, version);
    return {
      title,
      content,
    };
  }
}
