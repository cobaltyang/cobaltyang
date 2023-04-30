require("dotenv").config();
const { Octokit } = require("@octokit/rest");
const github = require("@actions/github");
const { writeFileSync } = require("fs");

async function run() {
  try {
    const { token } = process.env;
    const octokit = new Octokit({ auth: `token ${token}` });
    const username = github.context.repo.owner;

    async function queryFollowers(page = 1) {
      let { data: followers } = await octokit.users.listFollowersForUser({
        username,
        per_page: 100,
        page,
      });
      if (followers.length >= 100) {
        followers = followers.concat(await queryFollowers(page + 1));
      }
      return followers;
    }

    async function queryFollowing(page = 1) {
      let { data: following } = await octokit.users.listFollowingForUser({
        username,
        per_page: 100,
        page,
      });
      if (following.length >= 100) {
        following = following.concat(await queryFollowing(page + 1));
      }
      return following;
    }

    const { data: user } = await octokit.users.getByUsername({
      username,
    });

    const followers = await queryFollowers();
    followers.reverse();

    const following = await queryFollowing();

    const { cobaltsert } = process.env;
    const octokit2 = new Octokit({
      auth: `${cobaltsert}`,
    });

    // const content = 'Hello, world!';
    // const gistId = "9f270c4d447011f8e6901262398a69f5";
    // octokit2.gists
    //   .update({
    //     gist_id: gistId,
    //     files: {
    //       "introduce.md": {
    //         content: content,
    //       },
    //     },
    //   })
    //   .then((response) => {
    //     // 更新成功
    //     console.log(`Gist updated successfully: ${response.data.html_url}`);
    //   })
    //   .catch((error) => {
    //     // 更新失败
    //     console.error(`Failed to update Gist: ${error.message}`);
    //   });

    const middle = `
## Followers <kbd>${followers.length}</kbd>

<table>
  ${formatTable(followers)}
</table>

`;
    const fs = require("fs");

    // 读取原始文件内容
    const content = fs.readFileSync("./README.md", "utf-8");

    // 找到要插入内容的位置
    const insertIndex =
      content.indexOf("<!-- insert your content here -->") +
      "<!-- insert your content here -->".length;

    // 插入要添加的内容
    const before1 = content.substring(0, insertIndex);
    const after = content.substring(insertIndex);
    const newContent = middle;
    const updatedContent = before1 + newContent + after;

    // 将修改后的文档写回文件
    fs.writeFileSync("./README.md", updatedContent);

    console.log("Done!");
  } catch (error) {
    console.log(error.message);
  }
}

function formatTable(arr) {
  if (arr.length === 0) {
    return "";
  }
  let result = "";
  let row = arr.length / 5;
  const lastNo = arr.length % 5;
  if (lastNo != 0) row += 1;
  for (let j = 1; j <= row; j += 1) {
    let data = "";
    data = `<tr>
    <td width="150" align="center">${getUser(arr[(j - 1) * 5])}
    </td>
    <td width="150" align="center">${getUser(arr[(j - 1) * 5 + 1])}
    </td>
    <td width="150" align="center">${getUser(arr[(j - 1) * 5 + 2])}
    </td>
    <td width="150" align="center">${getUser(arr[(j - 1) * 5 + 3])}
    </td>
    <td width="150" align="center">${getUser(arr[(j - 1) * 5 + 4])}
    </td>
  </tr>`;
    result += data;
  }
  return result;
}

function getUser(user) {
  return user
    ? `
      <a href="${user.html_url}">
        <img src="${user.avatar_url}" width="50" />
        <br />
        ${user.login}
      </a>`
    : "";
}

run();
