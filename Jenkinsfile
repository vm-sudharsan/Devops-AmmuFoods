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
            description: 'Choose deployment action'
        )

        string(
            name: 'ROLLBACK_VERSION',
            defaultValue: '',
            description: 'Build number to rollback'
        )
    }

    stages {

        stage('Verify Kubernetes') {
            steps {
                bat 'kubectl version --client'
                bat 'kubectl get nodes'
            }
        }

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
                    env.GIT_COMMIT_SHORT = powershell(
                        script: '(git rev-parse --short HEAD).Trim()',
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

                    bat '''
                    docker build ^
                    --build-arg VITE_API_URL=http://ammufoods-backend-service:5000/api ^
                    -t ammu-frontend:latest .
                    '''
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

stage('Deploy To Kubernetes') {

    when {
        expression {
            params.DEPLOY_ACTION == 'DEPLOY'
        }
    }

    steps {

        script {
            env.PREVIOUS_BUILD =
                (env.BUILD_NUMBER.toInteger() - 1).toString()

            echo "Previous Build: ${env.PREVIOUS_BUILD}"
        }

        bat '''
        kubectl set image deployment/ammufoods-backend ^
        backend=%BACKEND_IMAGE%:%BUILD_NUMBER%
        '''

        bat '''
        kubectl set image deployment/ammufoods-frontend ^
        frontend=%FRONTEND_IMAGE%:%BUILD_NUMBER%
        '''

        bat 'kubectl rollout status deployment/ammufoods-backend'
        bat 'kubectl rollout status deployment/ammufoods-frontend'
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

                bat '''
                kubectl set image deployment/ammufoods-backend ^
                backend=sudharsanprakalathanvm/ammufoods-backend:%ROLLBACK_VERSION%
                '''

                bat '''
                kubectl set image deployment/ammufoods-frontend ^
                frontend=sudharsanprakalathanvm/ammufoods-frontend:%ROLLBACK_VERSION%
                '''

                bat 'kubectl rollout status deployment/ammufoods-backend'
                bat 'kubectl rollout status deployment/ammufoods-frontend'
            }
        }

        stage('Verify Deployment') {

            when {
                anyOf {
                    expression { params.DEPLOY_ACTION == 'DEPLOY' }
                    expression { params.DEPLOY_ACTION == 'ROLLBACK' }
                }
            }

            steps {

                bat 'kubectl get pods'

                bat '''
                kubectl rollout status deployment/ammufoods-backend
                '''

                bat '''
                kubectl rollout status deployment/ammufoods-frontend
                '''

                bat '''
                kubectl get deployment
                '''
            }
        }

      


        stage('Health Check') {

            when {
                expression {
                    params.DEPLOY_ACTION == 'DEPLOY'
                }
            }

            steps {
                bat '''
                kubectl exec curlpod -- \
                curl --fail http://ammufoods-backend-service:5000/api/health
                '''
            }
        }
    }

    post {
        failure {
            script {
                echo "Deployment Failed"
                echo "Rolling back to build ${env.PREVIOUS_BUILD}"

                bat """
                kubectl set image deployment/ammufoods-backend ^
                backend=sudharsanprakalathanvm/ammufoods-backend:${env.PREVIOUS_BUILD}
                """

                bat """
                kubectl set image deployment/ammufoods-frontend ^
                frontend=sudharsanprakalathanvm/ammufoods-frontend:${env.PREVIOUS_BUILD}
                """

                bat 'kubectl rollout status deployment/ammufoods-backend'
                bat 'kubectl rollout status deployment/ammufoods-frontend'

                echo "Rollback Completed"
            }
        }
    }
}
