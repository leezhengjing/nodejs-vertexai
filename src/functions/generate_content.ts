/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Make a async call to generate content.
 * @param request A GenerateContentRequest object with the request contents.
 * @returns The GenerateContentResponse object with the response candidates.
 */

import {
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  RequestOptions,
  SafetySetting,
  StreamGenerateContentResult,
  Tool,
} from '../types/content';
import {GoogleGenerativeAIError} from '../types/errors';
import * as constants from '../util/constants';

import {
  processUnary,
  processStream,
  throwErrorIfNotOK,
  throwErrorIfNotOKGoogleAuth
} from './post_fetch_processing';
import {postRequest, postRequestGoogleAuth} from './post_request';
import {
  formatContentRequest,
  validateGenerateContentRequest,
  validateGenerationConfig,
} from './pre_fetch_processing';
import {GoogleAuth} from 'google-auth-library';

export async function generateContentGoogleAuth(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  googleAuth: GoogleAuth,
  token: Promise<string | null | undefined>,
  request: GenerateContentRequest | string,
  apiEndpoint?: string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  tools?: Tool[],
  requestOptions?: RequestOptions
): Promise<GenerateContentResult> {
  request = formatContentRequest(request, generationConfig, safetySettings);

  validateGenerateContentRequest(request);

  if (request.generationConfig) {
    request.generationConfig = validateGenerationConfig(
      request.generationConfig
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    generationConfig: request.generationConfig ?? generationConfig,
    safetySettings: request.safetySettings ?? safetySettings,
    tools: request.tools ?? tools,
  };
  const response = await postRequestGoogleAuth({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: constants.GENERATE_CONTENT_METHOD,
    googleAuth,
    token: await token,
    data: generateContentRequest,
    apiEndpoint: apiEndpoint,
    requestOptions: requestOptions,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request to model', e);
  });
  await throwErrorIfNotOKGoogleAuth(response).catch(e => {
    throw e;
  });
  // return processUnary(response);
  return Promise.resolve({
    response: response.data,
  });
}


export async function generateContent(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  token: Promise<string | null | undefined>,
  request: GenerateContentRequest | string,
  apiEndpoint?: string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  tools?: Tool[],
  requestOptions?: RequestOptions
): Promise<GenerateContentResult> {
  request = formatContentRequest(request, generationConfig, safetySettings);

  validateGenerateContentRequest(request);

  if (request.generationConfig) {
    request.generationConfig = validateGenerationConfig(
      request.generationConfig
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    generationConfig: request.generationConfig ?? generationConfig,
    safetySettings: request.safetySettings ?? safetySettings,
    tools: request.tools ?? tools,
  };
  const response: Response | undefined = await postRequest({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: constants.GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint: apiEndpoint,
    requestOptions: requestOptions,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request to model', e);
  });
  await throwErrorIfNotOK(response).catch(e => {
    throw e;
  });
  return processUnary(response);
}

/**
 * Make an async stream request to generate content. The response will be
 * returned in stream.
 * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
 * @returns {Promise<StreamGenerateContentResult>} Promise of {@link
 *     StreamGenerateContentResult}
 */
export async function generateContentStream(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  token: Promise<string | null | undefined>,
  request: GenerateContentRequest | string,
  apiEndpoint?: string,
  generationConfig?: GenerationConfig,
  safetySettings?: SafetySetting[],
  tools?: Tool[],
  requestOptions?: RequestOptions
): Promise<StreamGenerateContentResult> {
  request = formatContentRequest(request, generationConfig, safetySettings);
  validateGenerateContentRequest(request);

  if (request.generationConfig) {
    request.generationConfig = validateGenerationConfig(
      request.generationConfig
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    generationConfig: request.generationConfig ?? generationConfig,
    safetySettings: request.safetySettings ?? safetySettings,
    tools: request.tools ?? tools,
  };
  const response = await postRequest({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: constants.STREAMING_GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint: apiEndpoint,
    requestOptions: requestOptions,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request', e);
  });
  await throwErrorIfNotOK(response).catch(e => {
    throw e;
  });
  return processStream(response);
}
