import { NextPage } from 'next';
import Head from 'next/head';
import React from 'react';

const PosterTemplate: NextPage = () => {
  return (
    <>
      <Head>
        <title>Poster Template</title>
        <meta name="description" content="Template for poster generation" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="poster-container">
        <div className="header-content"></div>
        <div className="poster-content">
          <div className="markdown-content"></div>
        </div>
        <div className="footer-content"></div>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'SimSun', sans-serif;
        }
        
        body {
          background-color: white;
        }
        
        .poster-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 20px;
          background-color: white;
        }
        
        .header-content {
          padding: 10px 0;
          text-align: center;
          font-size: 18px;
        }
        
        .poster-content {
          flex: 1;
          padding: 20px;
          border-radius: 8px;
          background-color: white;
        }
        
        .markdown-content {
          width: 100%;
        }
        
        .footer-content {
          padding: 10px 0;
          text-align: center;
          font-size: 14px;
          color: #666;
        }
        
        /* Markdown styling */
        .markdown-content h1 { font-size: 24px; margin-bottom: 16px; }
        .markdown-content h2 { font-size: 22px; margin-bottom: 14px; }
        .markdown-content h3 { font-size: 20px; margin-bottom: 12px; }
        .markdown-content p { margin-bottom: 12px; line-height: 1.6; }
        .markdown-content ul, .markdown-content ol { margin-left: 20px; margin-bottom: 12px; }
        .markdown-content li { margin-bottom: 6px; }
        .markdown-content code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        .markdown-content pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; margin-bottom: 12px; }
        .markdown-content blockquote { border-left: 4px solid #ddd; padding-left: 10px; margin-left: 0; color: #666; }
        .markdown-content img { max-width: 100%; height: auto; }
        .markdown-content table { border-collapse: collapse; width: 100%; margin-bottom: 12px; }
        .markdown-content table, .markdown-content th, .markdown-content td { border: 1px solid #ddd; }
        .markdown-content th, .markdown-content td { padding: 8px; text-align: left; }
      `}</style>
    </>
  );
};

export default PosterTemplate; 