pipeline {
agent any

environment {
    DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
    BACKEND_IMAGE = "sudharsanprakalathanvm/ammufoods-backend"
    FRONTEND_IMAGE = "sudharsanprakalathanvm/ammufoods-frontend"
}

stages {

    stage('Verify Tools') {
        steps {
            bat 'git --version'
            bat 'docker --version'
        }
    }

    stage('Build Metadata') {
    steps {

        script {
            env.GIT_COMMIT_SHORT =
                bat(
                    script: 'git rev-parse --short HEAD',
                    returnStdout: true
                ).trim()

            env.BUILD_TIMESTAMP =
                new Date().format(
                    "yyyy-MM-dd_HH-mm-ss"
                )
        }

        echo "Build Number : ${env.BUILD_NUMBER}"
        echo "Git Commit   : ${env.GIT_COMMIT_SHORT}"
        echo "Timestamp    : ${env.BUILD_TIMESTAMP}"
    }
}

    stage('Build Backend Image') {
        steps {
            dir('backend') {
                bat 'docker build -t ammu-backend:latest .'
            }
        }
    }

    stage('Build Frontend Image') {
        steps {
            dir('frontend') {
                bat 'docker build -t ammu-frontend:latest .'
            }
        }
    }

    stage('Tag Images') {
    steps {

        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:latest'
        bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:latest'

    }
}

    // new docker login 
    stage('Docker Hub Login') {
    steps {
        withCredentials([
            usernamePassword(
                credentialsId: 'dockerhub-creds',
                usernameVariable: 'DOCKER_USER',
                passwordVariable: 'DOCKER_PASS'
            )
        ]) {

            writeFile file: 'docker_token.txt', text: env.DOCKER_PASS

            bat '''
                type docker_token.txt | docker login -u %DOCKER_USER% --password-stdin
            '''
        }
    }
}
    // stage('Docker Hub Login') {
    //     steps {
    //         withCredentials([
    //             usernamePassword(
    //                 credentialsId: 'dockerhub-creds',
    //                 usernameVariable: 'DOCKER_USER',
    //                 passwordVariable: 'DOCKER_PASS'
    //             )
    //         ]) {
    //                 bat 'echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin'
    //         }
    //     }
    // }

    stage('Push Backend Image') {
    steps {

        bat 'docker push %BACKEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker push %BACKEND_IMAGE%:latest'

    }
}

stage('Push Frontend Image') {
    steps {

        bat 'docker push %FRONTEND_IMAGE%:%BUILD_NUMBER%'
        bat 'docker push %FRONTEND_IMAGE%:latest'

    }
}

    stage('Create Environment File') {
        steps {

            withCredentials([
                file(
                    credentialsId: 'ammufoods-env',
                    variable: 'ENVFILE'
                )
            ]) {

                bat 'copy "%ENVFILE%" backend\\.env'
            }
        }
    }

    stage('Create Deploy Variables') {
    steps {
        writeFile(
            file: 'deploy.env',
            text: "IMAGE_TAG=${env.BUILD_NUMBER}"
        )
    }
}

    stage('Deploy Application'){
        steps{

            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml down'

            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml pull'

            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml up -d'

        }
    }

    stage('Health Check') {
    steps {
        powershell '''
            Start-Sleep -Seconds 15

            $response = Invoke-RestMethod `
                -Uri "http://localhost:5000/api/health"

            if ($response.status -ne "ok") {
                throw "Backend Health Check Failed"
            }

            Write-Host "Backend Healthy"
            Write-Host $response.message
        '''
    }
}

    // Stage 1 testing of Jenkins Workflow
    // stage('Verify Git') {
    //     steps {
    //         bat 'git --version'
    //     }
    // }

    // stage('Verify Docker') {
    //     steps {
    //         bat 'docker --version'
    //     }

    // }

}

}
