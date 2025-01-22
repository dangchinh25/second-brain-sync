import { Either, error, success } from "../../types";
import { openaiClient } from "./openai.client";
import dedent from "dedent";

export const getGeneratePRDescriptionPrompt = (changeset: any) => {
  return dedent`
    Here is a list of file changes (additions and deletions) to a wiki website. 
    The file changes includes the type of change (addition or deletion) and the file path, only extract the file name to be used in the description.
    We have to create a PR with these change to publish the new content to the website.
    Generate a PR description for changeset with the following format:
    <Type of change>: <File name>
    
    ${JSON.stringify(changeset)}

    Make sure to format in a way that is easy to read and understand and compatible with Github description format.
  `;
};

export const generatePRDescription = async (
  changeset: any
): Promise<
  Either<
    Error,
    {
      prDescription: string;
    }
  >
> => {
  const chatCompletionResult = await openaiClient.chat.completions.create({
    messages: [
      {
        role: "user",
        content: getGeneratePRDescriptionPrompt(changeset),
      },
    ],
    model: "gpt-4o-mini",
  });

  const content = chatCompletionResult.choices[0].message.content;

  return success({ prDescription: content! });
};
