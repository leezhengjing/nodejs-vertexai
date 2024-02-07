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
 * @return The GenerateContentResponse object with the response candidates.
 */

import {
  GenerateContentRequest,
  GenerateContentResult,
  GenerationConfig,
  SafetySetting,
  StreamGenerateContentResult,
} from '../types/content';
import {GoogleGenerativeAIError} from '../types/errors';
import * as constants from '../util/constants';

import {
  processNonStream,
  processStream,
  throwErrorIfNotOK,
} from './post_fetch_processing';
import {postRequest} from './post_request';
import {
  formatContentRequest,
  validateGenerateContentRequest,
  validateGenerationConfig,
} from './pre_fetch_processing';

export async function generateContent(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  token: Promise<any>,
  apiEndpoint: string,
  request: GenerateContentRequest | string,
  generation_config?: GenerationConfig,
  safety_settings?: SafetySetting[]
): Promise<GenerateContentResult> {
  request = formatContentRequest(request, generation_config, safety_settings);

  validateGenerateContentRequest(request);

  if (request.generation_config) {
    request.generation_config = validateGenerationConfig(
      request.generation_config
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    generation_config: request.generation_config ?? generation_config,
    safety_settings: request.safety_settings ?? safety_settings,
    tools: request.tools ?? [],
  };

  const response: Response | undefined = await postRequest({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: constants.GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint: apiEndpoint,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request', e);
  });
  throwErrorIfNotOK(response);
  const result: GenerateContentResult = processNonStream(response);
  return Promise.resolve(result);
}

/**
 * Make an async stream request to generate content. The response will be
 * returned in stream.
 * @param {GenerateContentRequest} request - {@link GenerateContentRequest}
 * @return {Promise<StreamGenerateContentResult>} Promise of {@link
 *     StreamGenerateContentResult}
 */
export async function generateContentStream(
  location: string,
  project: string,
  publisherModelEndpoint: string,
  token: Promise<any>,
  apiEndpoint: string,
  request: GenerateContentRequest | string,
  generation_config?: GenerationConfig,
  safety_settings?: SafetySetting[]
): Promise<StreamGenerateContentResult> {
  request = formatContentRequest(request, generation_config, safety_settings);
  validateGenerateContentRequest(request);

  if (request.generation_config) {
    request.generation_config = validateGenerationConfig(
      request.generation_config
    );
  }

  const generateContentRequest: GenerateContentRequest = {
    contents: request.contents,
    generation_config: request.generation_config ?? generation_config,
    safety_settings: request.safety_settings ?? safety_settings,
    tools: request.tools ?? [],
  };
  const response = await postRequest({
    region: location,
    project: project,
    resourcePath: publisherModelEndpoint,
    resourceMethod: constants.STREAMING_GENERATE_CONTENT_METHOD,
    token: await token,
    data: generateContentRequest,
    apiEndpoint: apiEndpoint,
  }).catch(e => {
    throw new GoogleGenerativeAIError('exception posting request', e);
  });
  throwErrorIfNotOK(response);
  const streamResult = processStream(response);
  return Promise.resolve(streamResult);
}
