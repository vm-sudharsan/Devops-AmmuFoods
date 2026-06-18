pipeline {
agent any

environment {
    DOCKERHUB_USERNAME = "sudharsanprakalathanvm"
    BACKEND_IMAGE = "sudharsanprakalathanvm/ammufoods-backend"
    FRONTEND_IMAGE = "sudharsanprakalathanvm/ammufoods-frontend"
}

parameters {

    choice(
        name: 'DEPLOY_ACTION',
        choices: ['DEPLOY', 'ROLLBACK'],
        description: 'Deployment Action'
    )

    string(
        name: 'ROLLBACK_VERSION',
        defaultValue: '',
        description: 'Version to rollback'
    )
}

stages {

    stage('Verify Tools') {
        steps {
            bat 'git --version'
            bat 'docker --version'
        }
    }

    stage('Build Metadata') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            script {
                env.GIT_COMMIT_SHORT =
                    bat(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
            }

            echo "Build Number : ${env.BUILD_NUMBER}"
            echo "Git Commit   : ${env.GIT_COMMIT_SHORT}"
        }
    }

    stage('Build Backend Image') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {
            dir('backend') {
                bat 'docker build -t ammu-backend:latest .'
            }
        }
    }

    stage('Build Frontend Image') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {
            dir('frontend') {
                bat 'docker build -t ammu-frontend:latest .'
            }
        }
    }

    stage('Tag Images') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker tag ammu-backend:latest %BACKEND_IMAGE%:latest'

            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker tag ammu-frontend:latest %FRONTEND_IMAGE%:latest'
        }
    }

    stage('Docker Hub Login') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

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

                bat 'del docker_token.txt'
            }
        }
    }

    stage('Push Backend Image') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            bat 'docker push %BACKEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker push %BACKEND_IMAGE%:%GIT_COMMIT_SHORT%'
            bat 'docker push %BACKEND_IMAGE%:latest'
        }
    }

    stage('Push Frontend Image') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            bat 'docker push %FRONTEND_IMAGE%:%BUILD_NUMBER%'
            bat 'docker push %FRONTEND_IMAGE%:%GIT_COMMIT_SHORT%'
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

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            writeFile(
                file: 'deploy.env',
                text: "IMAGE_TAG=${env.BUILD_NUMBER}"
            )
        }
    }

    stage('Deploy Application') {

        when {
            expression {
                params.DEPLOY_ACTION == 'DEPLOY'
            }
        }

        steps {

            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml down'
            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml pull'
            bat 'docker compose --env-file deploy.env -f docker-compose.prod.yml up -d'
        }
    }

    stage('Rollback Deployment') {

        when {
            expression {
                params.DEPLOY_ACTION == 'ROLLBACK'
            }
        }

        steps {

            script {
                if (!params.ROLLBACK_VERSION?.trim()) {
                    error("ROLLBACK_VERSION is required")
                }
            }

            writeFile(
                file: 'rollback.env',
                text: "IMAGE_TAG=${params.ROLLBACK_VERSION}"
            )

            bat 'docker compose --env-file rollback.env -f docker-compose.prod.yml down'
            bat 'docker compose --env-file rollback.env -f docker-compose.prod.yml pull'
            bat 'docker compose --env-file rollback.env -f docker-compose.prod.yml up -d'
        }
    }

    stage('Health Check') {

        when {
            anyOf {
                expression { params.DEPLOY_ACTION == 'DEPLOY' }
                expression { params.DEPLOY_ACTION == 'ROLLBACK' }
            }
        }

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
}


}
